var url = require('url')
var request = require('request')
var Mitm 	= require("../src/mitm-server")
var assert 	= require("assert")
var util	= require("util")
var inspect = require("util").inspect
var http 	= require("http")
var fs 		= require("fs")

var _ = require("underscore")
var TestServers = require("../test/helpers/test-servers")
var Options	= require("./helpers/config")

var createTestHttp = TestServers.createHttp

function definePaths(dispatcher){
	// Test GET with query string
	dispatcher.onGet("/test", function(req, resp){
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

describe("a few simple tests with a node http server so that we can test different methods and body", function(done){

	var mitm;
	var remote;

	before(function(done){
		remote = createTestHttp(definePaths)
		remote.listen(9990, "127.0.0.1", function(){
			mitm = new Mitm(Options.options)
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
	
	it("proxy GET request get whiteacorn/ctl/ ", function(done){
		request({
		    // tunnel: true,
		    url: 'http://whiteacorn/ctl/',
		    proxy: 'http://localhost:' + 4001,
		  },function( err, res, body)
			{
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}
				assert.equal(res.statusCode, 200) // successful request
				assert.equal(body.includes("Whiteacorn - Admin"), true) // got the correct page
				assert.notEqual( typeof res.headers["mitm-proxy"], "undefined") //the Mitm-proxy actually ptocessed it
				done()
			}
		);
	})
	it("proxy GET request to test server - no query string", function(done){
		request({
		    url		: 'http://127.0.0.1:9990/test',
		    proxy	: 'http://localhost:' + 4001,
		  },function( err, res, body)
			{
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}
				assert.equal(res.statusCode, 200) // successful request
				var bodyObj = JSON.parse(body)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "GET")
				assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
				assert.deepEqual(bodyObj.query, {})
				done()
			}
		);
	})
	it("proxy GET request to test server - with query string", function(done){
		request({
		    // tunnel: true,
			method	:"GET",
		    url		: 'http://127.0.0.1:9990/test?var1=value1&var2=value2',
		    proxy	: 'http://localhost:' + 4001,
		  },function( err, res, body)
			{
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}
				assert.equal(res.statusCode, 200) // successful request
				var bodyObj = JSON.parse(body)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "GET")
				assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
				assert.equal(bodyObj.query.var1, "value1")
				done()
			}
		);
	})
	it("direct POST request to test server - with body", function(done){
		var bodyText = "This is some BODY text";
		request({
			method: "POST",
		    url: 'http://127.0.0.1:9990/test',
			body: bodyText
		  }
		  ,function( err, res, body)
			{
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}

				assert.equal(res.statusCode, 200) // successful request
				var bodyObj = JSON.parse(body)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "POST")
				assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
				assert.equal(bodyObj.body, bodyText)
				done()
			}
		)
	})
	it("proxy POST request to test server - with body, also tests proxy 'finish' event", function(done){
		
		var signalDone = _.after(2, function(){
			done()
		})

		mitm.on("finish", function(req, resp){
			// get here only if we got the event from mitm
			signalDone();
			return;
			console.log("GOT AN EVENT FROM MITM", req.constructor.name, resp.constructor.name)
			console.log("==============================================================================")
			console.log("HTTP/"+req.httpVersion)
			console.log(req.method)
			console.log(req.url)
			console.log(req.headers)
			console.log(req.rawBody.toString())
			console.log("-----------------------------------------------------------------------------")
			console.log("HTTP/"+resp.httpVersion)
			console.log(resp.statusCode)
			console.log(resp.statusMessage)
			console.log(resp.headers)
			console.log(resp.rawBody.toString())
			console.log("-----------------------------------------------------------------------------")
		})
		var bodyText = "This is SOME body text";
		
		request({
			method: "POST",
		    url: 'http://127.0.0.1:9990/test',
		    proxy: 'http://localhost:' + 4001,
			body : bodyText
		  }
		  ,function( err, res, body)
			{
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}

				assert.equal(res.statusCode, 200) // successful request
				var bodyObj = JSON.parse(body)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "POST")
				assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
				assert.equal(bodyObj.body, bodyText)
				signalDone()
			}
		)
	})

})