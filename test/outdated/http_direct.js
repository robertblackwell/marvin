var request = require('request')
var Mitm 	= require("../src/mitm-server")
var assert 	= require("assert")
var inspect = require("util").inspect
var http 	= require("http")
var net = require('net')
var dispatcher = require('httpdispatcher')
const _ = require("underscore")
var done = function(){}

dispatcher.onPost("/test", function(req, resp){
	console.log("/test handler called", req.body)
	var bObj = {
	      protocol: req.protocol,
	      method:   req.method,
	      query:    req.query,
	      body:     req.body,
	      headers:  req.headers
    }
	resp.writeHead(200)
	resp.write(JSON.stringify(bObj))
	resp.end()
})
dispatcher.onGet("/test", function(req, resp){
	console.log("/test handler called", req.body)
	var bObj = {
	      protocol: req.protocol,
	      method:   req.method,
	      query:    req.query,
	      body:     req.body,
	      headers:  req.headers
    }
	resp.writeHead(200)
	resp.write(JSON.stringify(bObj))
	resp.end()
})

var handler = function(req, resp)
{
	console.log("handler called")
	dispatcher.dispatch(req, resp)
}

let netser = net.createServer((s)=>{
	s.on('data',(ck)=>{
		console.log(ck.toString())
		s.write("server received " + ck.toString())
	})
})
netser.listen(9991, ()=>{
	runTest(netser)
})

let remote = http.createServer(function(req, resp){
	console.log("request handler", req.url)
	dispatcher.dispatch(req, resp)
})
remote.on('connect', function(req, sock){
	console.log("connect handler")
	sock.write("HTTP/1.1 500 Connection established\r\nMitmServer: aheadersvalue\r\n\r\n")
	sock.on('end',()=>{
		console.log("CONNECT socket ended")
	})
	sock.on('drain',()=>{
		console.log("CONNECT socket drain")
	})
	sock.on('error',(err)=>{
		console.log("CONNECT socket err")
	})
	// sock.end()
})
remote.listen(9990, "127.0.0.1", function(){
	console.log("remote-listen callback")
	runTest(remote)
})

function runTest(server){	
	
	console.log("run test")
	let done = _.after(1, ()=>{
		server.close()
	})
	test_connect();
	function test_post(){
		var formData = {
			var1: "value1",
			var2: "value2"
		}
		request({
			method: "POST",
		    url: 'http://127.0.0.1:9990/test',
			body: "This is a request body"
		  }
		  ,function( err, res, body){
			  
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}
		
				assert.equal(res.statusCode, 200) // successful request
				var bodyObj = JSON.parse(body)
				console.log(bodyObj)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "POST")
				assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
				// assert.equal(bodyObj.query.var1, "value1")
				done()
			}
		)
	}
	//
	// The lesson here is that the request has to listen for the connect event
	// to get the proxies repose to the request
	//
	function test_connect(){
		let r = http.request({
			method: "CONNECT",
			hostname: "localhost",
			port:9990,
			path: 'http://127.0.0.1:9990',
		  }
		  ,function(res){
			  console.log("CONNECT response", res)
				done()
			}
		)
		r.end()
		r.on("connect",(res,socket,c)=>{
			console.log("connect event", res.statusCode, socket._handle.fd, c.length)
			http.request
		})
	}
	function sock_connect(){
		let sock = net.connect({port:9990, host:"localhost"},()=>{
			console.log("connected")
			sock.on('end',()=>{
				console.log("sock socket ended")
			})
			sock.on('drain',()=>{
				console.log("sock socket drain")
			})
			sock.on('error',(err)=>{
				console.log("sock socket err")
			})
			sock.on('data',(data)=>{
				console.log("sock: ", data.toString())
			})
			sock.write("HTTP/1.1 GET /test\r\n\r\n")			
			
		})
	}
}