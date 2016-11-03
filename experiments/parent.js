const cp = require('child_process')

const child = cp.fork(__dirname+"/child.js")

const message = {
	a: "thisisa",
	b: "this is b"
}
child.on('message',(msg)=>{
	console.log("parent: got a message from child", msg)
})
setTimeout((timer)=>{
	child.send(message)
})