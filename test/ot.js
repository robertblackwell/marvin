var util = require('util')
var _ = require('underscore')

var obj1 = {
	v1 : ["anan111", "bbbb111"],
	v11 : 11111,
	v2 : {
		sv1 : ['a111'],
		sv2 : 11111
	}
}

var obj2 = {
	v1 : ['bbbb22222'],
	v2 :{
		sv1 : ["c22222"]
	}
}

function ApplyDefaults(target, defaults){
	var target = {};
	for( p in defaults){
		if( target[p] === undefined && typeof defaults[p] == "object" && defaults[p] !== null){
			target[p] = {};
			ApplyDefaults(target[p], defaults[p]) 
		} else if( target[p] !== undefined && typeof defaults[p] == "object" && defaults[p] !== null){
				ApplyDefaults(target[p], defaults[p]) 
		} else if( target[p] === undefined && typeof defaults[p] != "object"){
			target[p] = defaults[p];
		}
	}
	return target;
}

var z = ApplyDefaults(obj2, obj1)

function clone(obj){
	var obj2 = {}
	for(p in obj){
		if( typeof obj[p] === "object" ){
			obj2[p] = clone(obj[p]);
		}else{
			obj2[p] = obj[p];
		}
	}
	return obj2;
}

var x1 = {}, x2 = {}, opt = {}, op = {}, op2 = {}, op3 = {};

// Object.assign(x1, obj1.v2)
// Object.assign(x2, obj2.v2)

// console.log("x1",x1)
// console.log("x2",x2)
// console.log("obj1.v2",obj1.v2)
// console.log("obj2.v2",obj2.v2)

//

var z1 = {};
_.defaults(obj2, obj1)

/**
* This one works - put defaults ahead of new values
*/
var opt = {};
var default_options = obj1
var options = obj2
Object.assign(opt, default_options, options)
console.log("opt: ", opt)
Object.assign(z1, obj1, obj2)
console.log("_.defaults: ", obj2)
console.log("z : ", z1)