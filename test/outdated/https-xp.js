var url = require('url')
const net = require('net')
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
var TestServers = require("../test/helpers/test-servers")
var Options	= require("./helpers/config")

var createServer = TestServers.createHttps

const serverOptions = {
  key: fs.readFileSync(__dirname + '/helpers/certs/server-key.pem'),
  cert: fs.readFileSync(__dirname + '/helpers/certs/server-cert.pem')
};


function definePaths(dispatcher)
{
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
describe("mikey mouse", function(done){
	var mitm;
	var remote;

	before(function(done){
		remote = TestServers.createHttps(serverOptions, definePaths)
		remote.listen(9443, "localhost", function(){
			mitm = new Mitm(Options)
			mitm.listen(4001, "localhost", function(){
				done()
			})
		})
	})
	after(function(done){
		remote.close(function(){
			mitm.close(()=>{
				done()			
			})
		})
	})

	it("issue CONNECT request tosee if marvin gets it", function(done){
		// let socket = net.connect({port: 4001}, ()=>{
		// 	console.log("connected")
		// 	socket.on('data', (data)=>{
		// 		console.log(data);
		// 	});
		// 	socket.write("HTTP/1.1 GET /\r\n\r\n")
		// 	socket.end()
		// })
		let r = http.request({
			method	:"CONNECT",
		    host	: "localhost",
			port : 4001,
			path: "/test?var1=value1&var2=value2",

		  },function(res)
			{
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}
				console.log(res)
				done()
			}
		);
		r.on("error", (err)=>{
			console.log(err)
		})
	})
	
	//
	// it("proxy GET request to test server - with query string", function(done){
	// 	request({
	// 	    tunnel: false,
	// 		method	:"GET",
	// 	    url		: 'https://localhost:9443/test?var1=value1&var2=value2',
	// 	    proxy	: 'https://localhost:' + 4001,
	// 	  },function( err, res, body)
	// 		{
	// 			if (err) {
	// 				console.log("simple proxy - got error", err)
	// 				throw err;
	// 				done();
	// 			}
	// 			assert.equal(res.statusCode, 200) // successful request
	// 			var bodyObj = JSON.parse(body)
	// 			assert.notEqual(bodyObj,null)
	// 			assert.equal(bodyObj.method, "GET")
	// 			assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
	// 			assert.equal(bodyObj.query.var1, "value1")
	// 			done()
	// 		}
	// 	);
	// })

})