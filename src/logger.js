
LogLevels = {
	ERROR : 1,
	WARN  : 2,
	LOG	 : 3,
	INFO  : 4,
	DEBUG : 5
}
let enabled = true;
console.log("Logger::enabled", enabled)

var logger = function logger(level){
	if( typeof level !== "number" || (level < LogLevels.ERROR || level > LogLevels.DEBUG) )
		throw new Error("level is invalid : "+ level)
	this.level = level
}
logger.prototype.error=function(){
	let args = Array.from(arguments)
	args[0] = "ERROR::" + args[0]
	if( LogLevels.ERROR <= this.level && enabled)
		console.error.apply(this, args)
}
logger.prototype.warn=function(){
	let args = Array.from(arguments)
	args[0] = "WARN::" + args[0]
	if( LogLevels.WARN <= this.level && enabled)
		console.warn.apply(this, args)
}
logger.prototype.log=function(){
	let args = Array.from(arguments)
	args[0] = "LOG::" + args[0]
	if( LogLevels.LOG <= this.level && enabled)
		console.info.apply(this, args)
}
logger.prototype.info=function(){
	let args = Array.from(arguments)
	args[0] = "INFO::" + args[0]
	if( LogLevels.INFO <= this.level && enabled)
		console.info.apply(this, args)
}
logger.prototype.debug=function(){
	let args = Array.from(arguments)
	args[0] = "DEBUG::" + args[0]
	if( LogLevels.DEBUG <= this.level && enabled)
		console.log.apply(this, args)
}

module.exports = {
	LogLevels: LogLevels,
	enable	: function(){enabled = true;},
	disable	: function(){enabled = false;},
	createLogger : function(level){
		return new logger(level)
	}
}

// function Test(){}
// Test.prototype.test = function(){
// 	let c = new logger(3);
// 	c.error("This is an ERROR message %d, %d, %d", 1,2 ,3)
// 	c.warn("This is an WARN message %d, %d, %d", 1,2 ,3)
// 	c.info("This is an INFO message %d, %d, %d", 1,2 ,3)
// 	c.debug("This is an DEBUG message %d, %d, %d", 1,2 ,3)
// }
//
// class TestClass{
// 	constructor(){}
// 	test(){
// 		let c = new logger(2);
// 		c.error("This is an ERROR message %d, %d, %d", 1,2 ,3)
// 		c.warn("This is an WARN message %d, %d, %d", 1,2 ,3)
// 		c.info("This is an INFO message %d, %d, %d", 1,2 ,3)
// 		c.debug("This is an DEBUG message %d, %d, %d", 1,2 ,3)
// 	}
// }
//
// let t = new Test();
// t.test()
//
// let tc = new TestClass()
// tc.test()