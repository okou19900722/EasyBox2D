window.Physics.Category = cc.Enum({
	A: 1,
	B: 2,
	C: 4,
	D: 8,
	E: 16,
	F: 32,
	AA: 64,
	BB: 128,
	CC: 256,
	DD: 512,
	EE: 1024,
	FF: 2048,
	AAA: 4096,
	AAAA: 8192,
	BBQ: 16384,
});

window.Physics.CollsionTarget = cc.Class({
	name: 'CollsionTarget',
	ctor: function () {},
	properties: {
		A: false,
		B: false,
		C: false,
		D: false,
		E: false,
		F: false,
		AA: false,
		BB: false,
		CC: false,
		DD: false,
		EE: false,
		FF: false,
		AAA: false,
		AAAA: false,
		BBQ: false,
	},
	clone: function () { return new Physics.CollsionTarget(); },
});