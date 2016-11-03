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
		console.log("GET path /test")
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

describe("test CONNECT to slave", function(done){
	var mitm;
	var remote;

	before(function(done){
		remote = TestServers.createHttps(serverOptions, definePaths)
		remote.listen(9443, "localhost", function(){
			mitm = new Mitm(Options)
			mitm.listen(4001, "127.0.0.1", function(){
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

	it("Test direct call to https server", function(done){
		
	})
	it("proxy GET request to test server - no query string", function(done){
		var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request({
			tunnel : true,
			method : "GET",
		    url		: 'https://localhost:4001',
			pathkey	: '/test',
		    // proxy	: 'http://localhost:' + 4001,
			rejectUnauthorized: false,
			ca: ca,
		  },function( err, res, body)
			{
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}
				console.log("returned from https server ",res.statusCode)
				assert.equal(res.statusCode, 200) // successful request
				var bodyObj = JSON.parse(body)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "GET")
				assert.equal(bodyObj.headers.host, "localhost:9443")
				assert.deepEqual(bodyObj.query, {})
				done()
			}
		);
	})

})