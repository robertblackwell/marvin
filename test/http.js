const url 		= require('url')
const request 	= require('request')
const assert 	= require("assert")
const util		= require("util")
const inspect 	= require("util").inspect
const http 		= require("http")
const fs 		= require("fs")
const _ 		= require("underscore")

const Mitm 		= require("mitm-server")
const Logger 	= require("logger")

const TestServers 	= require("test/helpers/test-servers")
const Helpers 		= require("test/helpers/functions")
let Options			= require("test/helpers/config")

let verbose = true
let tlog = Helpers.testLogger(verbose).log
Logger.disable()

describe("a few simple tests with a node http server so that we can test different methods and body", function(done){
	let mitm;
	let remote;
	let serverPort = 9990
	let proxyPort = 4001

	before(function(done){
		Helpers.startHTTPServers(serverPort, proxyPort, Options, (r, m)=>{
			remote = r; mitm = m; done()
		})
		// remote = TestServers.createHttp()
		// remote.listen(9990, "127.0.0.1", function(){
		// 	mitm = new Mitm(Options)
		// 	mitm.listen(4001, "127.0.0.1", function(){
		// 		done()
		// 	})
		// })
	})
	after(function(done){
		Helpers.closeServers(remote, mitm, done)
		// remote.close(function(){
		// 	mitm.close(()=>{
		// 		done()
		// 	})
		// })
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
				// assert.notEqual( typeof res.headers["mitm"], "undefined") //the Mitm-proxy actually ptocessed it
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
				let bodyObj = JSON.parse(body)
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
				let bodyObj = JSON.parse(body)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "GET")
				assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
				assert.equal(bodyObj.query.var1, "value1")
				done()
			}
		);
	})
	it("direct POST request to test server - with body", function(done){
		let bodyText = "This is some BODY text";
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
				let bodyObj = JSON.parse(body)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "POST")
				assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
				assert.equal(bodyObj.body, bodyText)
				done()
			}
		)
	})
	it("proxy POST request to test server - with body, also tests proxy 'finish' event", function(done){
		
		let signalDone = _.after(2, function(){
			done()
		})

		mitm.on("finish", function(tx){
			// get here only if we got the event from mitm
			// signalDone();
			// return;
			tlog("GOT AN EVENT FROM MITM")
			tlog("==============================================================================")
			tlog("report type: " + tx.type)
			tlog("report protocol: " + tx.protocol)
			tlog("HTTP/"+tx.request.httpVersion)
			tlog(tx.request.method)
			tlog(tx.request.url)
			tlog(tx.request.headers)
			tlog(tx.request.rawBody)
			// tlog(tx.request.rawBody.toString())
			tlog("-----------------------------------------------------------------------------")
			tlog("HTTP/"+tx.response.httpVersion)
			tlog(tx.response.statusCode)
			tlog(tx.response.statusMessage)
			tlog(tx.response.headers)
			tlog(tx.response.rawBody)
			// tlog(tx.response.rawBody.toString())
			tlog("-----------------------------------------------------------------------------")
			signalDone()
		})
		let bodyText = "This is SOME body text";
		
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
				let bodyObj = JSON.parse(body)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "POST")
				assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
				assert.equal(bodyObj.body, bodyText)
				signalDone()
			}
		)
	})

})