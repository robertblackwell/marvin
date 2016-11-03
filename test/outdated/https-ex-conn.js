var url = require('url')
var request = require('request')
var Mitm 	= require("../src/mitm-server")
var assert 	= require("assert")
var util	= require("util")
var fs = require('fs')
var inspect = require("util").inspect
var http 	= require("http")
var https 	= require("https")
var _ = require("underscore")
var TestServers = require("../test/helpers/test-servers")

rawServer();
// withTestServer()

function runRequests(server){
	
	let requests = [];
	
	// requests.push(request_connect);
	// function request_connect(done){
	//
	// 	console.log("request_connect about to issue a request")
	// 	var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
	// 	var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
	// 	const opt = {
	// 		hostname: 'localhost',
	// 		port: 9991,
	// 		method: 'CONNECT',
	// 		// rejectUnauthorized: false,
	// 		// requestCert: true,
	// 	}
	// 	let r = http.request(opt, function(res){
	// 		console.log("request_1 got a response")
	// 		res.on('data', (chk)=>{
	// 			console.log("body chunk: ",chk.toString())
	// 		})
	// 		res.on('end',()=>{
	// 			console.log("request_1 end")
	// 			done()
	// 		})
	// 		res.on('error',(err)=>{
	// 			console.log("error", err)
	// 		})
	// 	}).end()
	// }
	//
	//
	// requests.push(request_4);
	// function request_4(done){
	// 	console.log("request_3 about to issue a request")
	// 	request({
	// 		method: "CONNECT",
	// 		url : "http://localhost:9991/test",
	// 		path : "apath", //NOTE Path does not do anything
	//
	// 	}, function(err, res, body){
	// 		console.log("request_3 got a response", err, res.statusCode, body);
	// 		done();
	// 	})
	// }
	requests.push(request_5);
	function request_5(done){
		console.log("request_5 about to issue a request")
		request({
			method: "GET",
			url : "http://localhost:9991/test",
		}, function(err, res, body){
			console.log("request_4 got a response", err);
			done();
		})
	}

	let numberOfRequests = requests.length;
	let done = _.after(numberOfRequests, function(){
		server.close()
	})
	
	requests.forEach(function(reqFunc, ix){
		reqFunc(done)
	})
}

function rawServer(){

	var server = http.createServer(function(req, resp){
		console.log(__dirname+" server got a request")
		resp.writeHead(200)
		resp.write("this is a response")
		resp.end()
	
	})
	server.on('connect', (req, socket, head)=>{
		console.log("got connect request")
		socket.write("HTTP/1.1 200 OK connected \r\n\r\n")
		socket.end();
		socket.on('end', ()=>{
			socket.close()
			done()
		})
	})
	console.log("listen 9991")
	server.listen(9991, function(){
		console.log("listen call back")
		runRequests(server)
	})
}

function withTestServer(){

	const definePaths = function definePaths(dispatcher)
	{
		dispatcher.onGet("/", function(req, resp){
			resp.writeHead(200, {'Content-type' : 'text/plain'})
			resp.end("XXXX from test server")
		})
		// Test GET with query string
		dispatcher.onGet("/test", function(req, resp){
			// console.log("GET path /test")
			var bObj = {
				protocol: req.protocol,
				url 	: req.url,
				method	: req.method,
				query	: url.parse(req.url, true).query,
				body	: req.body,
				headers	: req.headers
		    }
			resp.writeHead(200, {'Content-type' : 'text/plain'})
			resp.write(JSON.stringify(bObj))
			resp.end()		
		})
		// Test POST with body
		dispatcher.onPost("/test", function(req, resp){
			// console.log("PUT path /test")
			var bObj = {
			      protocol: req.protocol,
			      method:   req.method,
			      body:     req.body,
			      headers:  req.headers
		    }
			resp.writeHead(200, {'Content-type' : 'text/plain'})
			resp.write(JSON.stringify(bObj))
			resp.end()
		})		
	}
	const serverOptions = {
	  key: fs.readFileSync(__dirname + '/helpers/certs/server-key.pem'),
	  cert: fs.readFileSync(__dirname + '/helpers/certs/server-cert.pem')
	};


	let remote = TestServers.createHttps(serverOptions, definePaths)
	
	remote.listen(9991, "localhost", function(){
		runRequests(remote)
	})


}