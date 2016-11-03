class TestClass{
	constructor(){}
	method(){
		console.log(Error.prepareStackTrace)
		try{
			throw new Error("this is an error");
		} catch(e){
			console.log("Caught an error")
			// console.log(e.fileName, e.lineNumber)
			console.log(e.stack)
			console.log(e.lineNumber)
		}
	}
}
let t = new TestClass()
t.method()
function fred(a){
		console.log(arguments.callee.caller)
}
fred()