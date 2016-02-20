/*************************************************
 * Create   : 2016/1/30
 * Update   : 2016/1/30
 * Author   : Jeason1997
 * FileName : Box2D_Engine.js
 * Describe : 
 *************************************************/

require('Physics');
require('Contact');

WorldData = function (gravity, allowSleep,
    timeStep, velocityIterations, positionIterations,
    bodyList, jointList) {
    this.gravity = gravity;
    this.allowSleep = allowSleep;
    this.timeStep = timeStep;
    this.velocityIterations = velocityIterations;
    this.positionIterations = positionIterations;
    this.bodyList = bodyList;
    this.jointList = jointList;
};

PhysicsDebugger = cc.Class({
    name: 'PhysicsDebugger',
    
    ctor: function () {
        
    },
    
    properties: {
        openDebug: false,
        lineThickness: 2,
        drawShape: false,
        drawJoint: false,
        drawAABB: false,
        drawRay: false,
        drawPair: false,
        drawCenterOfMass: false,
        drawController: false,
    },
    
    createDebugDraw: function () {
        var sprite = new cc.DrawNode();
        cc.Canvas.instance.node.parent._sgNode.addChild(sprite);
        var debugDraw = new b2DebugDraw();
        debugDraw.SetDrawScale(PTM_RATIO);
        debugDraw.SetSprite(sprite);
		debugDraw.SetFillAlpha(0.3);
		debugDraw.SetLineThickness(this.lineThickness);
        debugDraw.SetFlags(
            (this.drawShape ? b2DebugDraw.e_shapeBit : 0) |
            (this.drawJoint ? b2DebugDraw.e_jointBit : 0) |
            (this.drawAABB ? b2DebugDraw.e_aabbBit : 0) |
            (this.drawPair ? b2DebugDraw.e_pairBit : 0) |
            (this.drawCenterOfMass ? b2DebugDraw.e_centerOfMassBit : 0) |
            (this.drawController ? b2DebugDraw.e_controllerBit : 0));
        this.debugDraw = debugDraw;
    },
    
    getDebugDraw: function () {
        if (!this.debugDraw)
            this.createDebugDraw();
        return this.debugDraw;
    },
    
    clone: function () {
        return new PhysicsDebugger();
    },
});

Box2D_Engine = cc.Class({

    extends: cc.Component,
    
    editor: {
        menu: 'i18n:Box2D.Engine.menu',
        executeInEditMode: false,
        disallowMultiple: true,
    },

    statics: {
        _instance: null,
        worldData: null,
        bodyList: [],
        jointList: [],
    },

    properties: {
        playInEditor: {
            default: false,
            displayName: 'i18n:Box2D.Engine.playInEditor',
            tooltip: 'i18n:Box2D.Engine.playInEditor_tooltip',
            notify: function () {
                if (CC_EDITOR) {
                    this.pushDataToEditor();
                    Editor.Panel.open('Box2D.panel');
                    Editor.sendToPanel('Box2D.panel', 'physics:run', Box2D_Engine.worldData);
                }
            },
        },
        startEngine: {
            default: true,
            displayName: 'i18n:Box2D.Engine.startEngine',
            tooltip: 'i18n:Box2D.Engine.startEngine_tooltip',
        },
        gravity: {
            default: new cc.Vec2(0, -9.8),
            displayName: 'i18n:Box2D.Engine.gravity',
            tooltip: 'i18n:Box2D.Engine.gravity_tooltip',
            notify: function () {
                if (this.world) {
                    this.world.m_gravity = this.gravity;
                }
            },
        },
        allowSleep: {
            default: true,
            displayName: 'i18n:Box2D.Engine.allowSleep',
            tooltip: 'i18n:Box2D.Engine.allowSleep_tooltip',
            notify: function () {
                if (this.world) {
                    this.world.m_allowSleep = this.allowSleep;
                }
            },
        },
        timeStep: {
            default: 0.016,
            displayName: 'i18n:Box2D.Engine.timeStep',
            tooltip: 'i18n:Box2D.Engine.timeStep_tooltip',
        },
        velocityIterations: {
            default: 6,
            displayName: 'i18n:Box2D.Engine.velocityIterations',
            tooltip: 'i18n:Box2D.Engine.velocityIterations_tooltip',
        },
        positionIterations: {
            default: 2,
            displayName: 'i18n:Box2D.Engine.positionIterations',
            tooltip: 'i18n:Box2D.Engine.positionIterations_tooltip',
        },
        physicsDebugger: {
            default: new PhysicsDebugger(),
            type: PhysicsDebugger,
        },
        world: {
            default: null,
            visible: false,
        },
    },

    onLoad: function () {
        // Show FPS
        {
            cc.director.setDisplayStats(true);
            cc.SPRITE_DEBUG_DRAW = 2;
        }

        if (Box2D_Engine._instance) {
            Logger.error('The scene should only have one active Engine at the same time.');
            this.destroy();
            return;
        }
        Box2D_Engine._instance = this;

        this.world = new b2World(this.gravity, this.allowSleep);

        var contact = new b2ContactListener();
        var self = this;
        contact.BeginContact = function (contact) {
            self.doContact(ContactType.BEGIN_CONTACT, contact);
        };
        contact.EndContact = function (contact) {
            self.doContact(ContactType.END_CONTACT, contact);
        };
        contact.PreSolve = function (contact, oldManifold) {
            self.doContact(ContactType.PRE_CONTACT, contact, oldManifold);
        };
        contact.PostSolve = function (contact, impulse) {
            self.doContact(ContactType.POST_CONTACT, contact, impulse);
        };
        this.world.SetContactListener(contact);
        
        // DebugDraw
        this.world.SetDebugDraw(this.physicsDebugger.getDebugDraw());
    },

    update: function (dt) {
        if (this.startEngine) {
            this.world.Step(this.timeStep, this.velocityIterations, this.positionIterations);
            if (this.physicsDebugger.openDebug)
                this.world.DrawDebugData();
            this.world.ClearForces();
        }
    },

    pushDataToEditor: function () {
        var bodys = new Array(Box2D_Engine.bodyList.length);
        var joints = new Array(Box2D_Engine.jointList.length);
        for (i = 0; i < Box2D_Engine.bodyList.length; ++i) {
            var data = Box2D_Engine.bodyList[i].getBodyData();
            // 修复
            data.bodyDef.angle = -data.bodyDef.angle;
            var pos = data.bodyDef.position;
            data.bodyDef.position = new b2Vec2(
                pos.x, cc.Canvas.instance.designResolution.height / PTM_RATIO - pos.y);
            bodys.push(data);
        }
        for (i = 0; i < Box2D_Engine.jointList.length; ++i) {
            joints.push(Box2D_Engine.jointList[i].getJointData());
        }

        Box2D_Engine.worldData = new WorldData(
            new b2Vec2(this.gravity.x, -this.gravity.y),
            this.allowSleep,
            this.timeStep,
            this.velocityIterations,
            this.positionIterations,
            bodys, joints);
    },

    doContact: function (contactType, contact, arg) {
        var bodyA = contact.m_fixtureA.GetBody().GetUserData();
        var bodyB = contact.m_fixtureB.GetBody().GetUserData();
        var c = new Contact(contact);
        var eventA;
        var eventB;

        switch (contactType) {
            case ContactType.BEGIN_CONTACT:
                eventA = bodyA.onBeginContact;
                eventB = bodyB.onBeginContact;
                break;
            case ContactType.PRE_CONTACT:
                eventA = bodyA.onPreSolve;
                eventB = bodyB.onPreSolve;
                c.oldManifold = arg;
                break;
            case ContactType.POST_CONTACT:
                eventA = bodyA.onPostSolve;
                eventB = bodyB.onPostSolve;
                c.impulse = arg;
                break;
            case ContactType.END_CONTACT:
                eventA = bodyA.onEndContact;
                eventB = bodyB.onEndContact;
                break;
        }
        
        // A
        for (i = 0; i < eventA.length; ++i) {
            eventA[i](c);
        }
        
        // B
        for (i = 0; i < eventB.length; ++i) {
            eventB[i](c);
        }
    },
});

Object.defineProperty(Box2D_Engine, 'instance', {
    get: function () {
        if (!Box2D_Engine._instance) {
            var node = new cc.Node('Box2D_Engine');
            Box2D_Engine._instance = node.addComponent(Box2D_Engine);
        }
        return Box2D_Engine._instance;
    },
});