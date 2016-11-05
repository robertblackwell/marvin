//
// This file tests the functioning of the test https server by 
//	-	first accessing it directly
//	-	then accessing it through the proxy but with the server port selected to ensure
//		an anonymous tunnel is used
//	-	then through the proxy with a server port of 9443 to force the use of a slave https server, this is done twice
//		-	once with Options.sni = false to force a slave server for each hostname
//		-	once with Options.sni = true to for the use of SniSlaveMaster
//		In both cases the proxy leaves markers in the req/resp and the on 'finish' tReq and tResp objects
//		that passage through the forwarding agent and correct SlaveMaster can be tested
//
const url = require('url')
const request = require('request')
const Mitm 	= require("../src/mitm-server")
const assert 	= require("assert")
const util	= require("util")
const fs = require('fs')
const inspect = require("util").inspect
const http 	= require("http")
const https 	= require("https")
const _ = require("underscore")

const TestServers = require("../test/helpers/test-servers")
const MitmReportType = require("../src/mitm-report-type")
const MitmReport = require("../src/mitm-report")
//
// set up logging for this set of tests
//
const Logger = require("../src/logger")
Logger.enable()
const verbose = false;
const mylog = (verbose)? console : {log: function noLog(){}}

// constiables to control the tests
let Options	= require("./helpers/config")
// let remote = null;
// let mitm = null;

//helpers
function startServers(serverPort, proxyPort, Options, cb){
	let remote = null;
	let mitm = null;
	remote = TestServers.createHttps()
	remote.listen(serverPort, "localhost", function(){
		mitm = new Mitm(Options)
		mitm.listen(proxyPort, "127.0.0.1", function(){
			cb(remote, mitm)
		})
	})	
}
function closeServers(remote, mitm, done){
	remote.close(function(){
		mitm.close(()=>{
			done()
		})
	})	
}
function testRequestViaProxy(done, proxyPort, mitm, mitmText, slaveText){
	var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
	var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
	mitm.on('finish', (tx)=>{
		console.log(tx)
		if( tx.type === MitmReportType.HTTPS_TUNNEL){
			console.log("ITS A TUNNEL")
			return;
		}
			
		mylog.log("========================================================================")
		mylog.log("https.js::onFinish::req::headers", tx.request.headers  )
		mylog.log("https.js::onFinish::req::headers[slave]", tx.request.headers['slave']  )
		if( slaveText !== undefined ) assert.equal(tx.request.headers['slave'], slaveText)
		mylog.log("https.js::onFinish::req::body", tx.request.rawBody )
		mylog.log("https.js::onFinish::resp::headers", tx.response.headers )
		mylog.log("https.js::onFinish::resp::headers[slave]", tx.response.headers['slave'] )
		mylog.log("https.js::onFinish::resp::body", tx.response.rawBody )
		mylog.log("========================================================================")
	})
	request({
		tunnel : true,
		method : "GET",
	    url		: 'https://www.ssllabs.com/ssltest',
	    proxy	: 'http://localhost:' + proxyPort,
		rejectUnauthorized: false,
		ca: ca
	  },function( err, res, body)
		{
			if (err) {
				console.log("simple proxy - got error", err)
				throw err;
				done();
			}
			mylog.log("========================================================================")
			mylog.log("https.js::Response::statusCode", res.statusCode)
			mylog.log("https.js::Response::headers", res.headers)
			mylog.log("https.js::Response::body", body)
			assert.equal(res.statusCode, 200) // successful request
			// var bodyObj = JSON.parse(body)
			// mylog.log("https.js::Response::bodyObj", bodyObj)
			// mylog.log("========================================================================")
			// assert.notEqual(bodyObj,null)
			// assert.equal(bodyObj.method, "GET")
			// assert.equal(bodyObj.headers.host, "localhost:"+serverPort)
			// assert.equal(bodyObj.headers.mitm, mitmText) //prove it went through proxy
			// assert.equal(bodyObj.headers.slave, slaveText) //prove it went through proxy
			// assert.deepEqual(bodyObj.query, {})
			done()
		}
	);
}


describe("proxy access to https test server via non SNI https slave", function(done){
	const proxyPort = 4001
	const serverPort = 9443 //Note this forces the traffic through the slave server
	let remote = null;
	let mitm = null;
	
	
	mylog.log("https.js::Sni should be false", Options)
	before(function(done){
		Options.sni = false
		startServers(serverPort, proxyPort, Options, (r,m)=>{
			remote = r;
			mitm = m;
			done();
		})
	})
	after(function(done){
		closeServers(remote, mitm, done)
	})
	it("proxy GET request via proxy slave server to test https server", function(done){
		// a slave server marks the req and resp with two things 
		// headers['mitm']='upstream-req
		// headers['slave'] = "the slave masters whoAmI property", in this case PerHostnameSlaveMaster
		testRequestViaProxy(done, proxyPort, mitm, "upstream-req", "PerHostnameSlaveMaster")
	})
})
