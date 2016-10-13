var url = require('url')
var request = require('request')
var Mitm 	= require("../src/MitmServer")
var assert 	= require("assert")
var util	= require("util")
var fs = require('fs')
var inspect = require("util").inspect
var http 	= require("http")
var https 	= require("https")
var dispatcher = require('httpdispatcher')
var _ = require("underscore")
var TestServers = require("../test/helpers/test-servers")

var createServer = TestServers.createHttps

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
		remote = TestServers.createHttps({}, definePaths)
		remote.listen(9991, "localhost", function(){
			mitm = new Mitm({})
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
	/* this was only an initial experiment to gt an https server working - using raw https.request is too verbose*/
	// it("https.request", function(done){
	// 	// this is actually too complicated
	// 	var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
	// 	var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
	// 	var req = https.request({
	// 		host: 'localhost',
	// 		port: 9991,
	// 		path: '/test',
	// 		ca: ca,
	// 		method: 'GET',
	// 		// rejectUnauthorized: false,
	// 		// requestCert: true,
	// 		// agent: false
	//     },function(res){
	//     	console.log("GOT A RESP")
	// 		res.on('data', function(ck){
	// 			console.log(ck.toString())
	// 		})
	// 		res.on('end', function(){
	// 			done()
	// 		})
	//     })
	// 	req.on('error',(err)=>{
	// 		console.log("got error", err)
	// 		done()
	// 	}).end()
	// })

	it("https.request", function(done){
		var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request({
			method: "GET",
			url : "https://localhost:9991/test?var1=value1",
			ca : ca,
		}, function(err, res, body){
			//
			// IN here perform assert operations for any test
			//
			assert.equal(res.statusCode, 200)
			var obj = JSON.parse(body.toString())
			assert.equal(obj.query.var1, "value1")
			done()
		})

	})
})

describe("a few simple tests with a node http server so that we can test different methods and body", function(done){
	var mitm;
	var remote;

	before(function(done){
		remote = TestServers.createHttps({}, definePaths)
		remote.listen(9991, "localhost", function(){
			mitm = new Mitm({})
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

	it("direct GET request to test server - no query string", function(done){
		var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request({
			method: "GET",
		    url		: 'https://localhost:9991/test',
			ca : ca
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
				assert.equal(bodyObj.headers.host, "localhost:9991")
				assert.deepEqual(bodyObj.query, {})
				done()
			}
		);
	})
//
	it("proxy GET request to test server - no query string", function(done){
		request({
			tunnel : true,
			method : "GET",
		    url		: 'https://localhost:9991/test',
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
	// it("proxy GET request to test server - with query string", function(done){
	// 	request({
	// 	    // tunnel: true,
	// 		method	:"GET",
	// 	    url		: 'http://127.0.0.1:9990/test?var1=value1&var2=value2',
	// 	    proxy	: 'http://localhost:' + 4001,
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
	// it("direct POST request to test server - with body", function(done){
	// 	var bodyText = "This is some BODY text";
	// 	request({
	// 		method: "POST",
	// 	    url: 'http://127.0.0.1:9990/test',
	// 		body: bodyText
	// 	  }
	// 	  ,function( err, res, body)
	// 		{
	// 			if (err) {
	// 				console.log("simple proxy - got error", err)
	// 				throw err;
	// 				done();
	// 			}
	//
	// 			assert.equal(res.statusCode, 200) // successful request
	// 			var bodyObj = JSON.parse(body)
	// 			assert.notEqual(bodyObj,null)
	// 			assert.equal(bodyObj.method, "POST")
	// 			assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
	// 			assert.equal(bodyObj.body, bodyText)
	// 			done()
	// 		}
	// 	)
	// })
	// it("proxy POST request to test server - with body, also tests proxy 'finish' event", function(done){
	//
	// 	var signalDone = _.after(2, function(){
	// 		done()
	// 	})
	//
	// 	mitm.on("finish", function(req, resp){
	// 		// get here only if we got the event from mitm
	// 		signalDone();
	// 		return;
	// 		console.log("GOT AN EVENT FROM MITM", req.constructor.name, resp.constructor.name)
	// 		console.log("==============================================================================")
	// 		console.log("HTTP/"+req.httpVersion)
	// 		console.log(req.method)
	// 		console.log(req.url)
	// 		console.log(req.headers)
	// 		console.log(req.rawBody.toString())
	// 		console.log("-----------------------------------------------------------------------------")
	// 		console.log("HTTP/"+resp.httpVersion)
	// 		console.log(resp.statusCode)
	// 		console.log(resp.statusMessage)
	// 		console.log(resp.headers)
	// 		console.log(resp.rawBody.toString())
	// 		console.log("-----------------------------------------------------------------------------")
	// 	})
	// 	var bodyText = "This is SOME body text";
	//
	// 	request({
	// 		method: "POST",
	// 	    url: 'http://127.0.0.1:9990/test',
	// 	    proxy: 'http://localhost:' + 4001,
	// 		body : bodyText
	// 	  }
	// 	  ,function( err, res, body)
	// 		{
	// 			if (err) {
	// 				console.log("simple proxy - got error", err)
	// 				throw err;
	// 				done();
	// 			}
	//
	// 			assert.equal(res.statusCode, 200) // successful request
	// 			var bodyObj = JSON.parse(body)
	// 			assert.notEqual(bodyObj,null)
	// 			assert.equal(bodyObj.method, "POST")
	// 			assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
	// 			assert.equal(bodyObj.body, bodyText)
	// 			signalDone()
	// 		}
	// 	)
	// })

})