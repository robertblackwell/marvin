
const assert		= require("assert")
const async 		= require('async')
const url 			= require('url')
const request 		= require('request')
const Mitm 			= require("../src/mitm-server")
const util			= require("util")
const fs 			= require('fs')
const inspect 		= require("util").inspect
const http 			= require("http")
const https 		= require("https")
const process		= require('process')
const _ 			= require("underscore")
const TestServers 	= require("../test/helpers/test-servers")
const Helpers 		= require("../test/helpers/functions")
const Options		= require("../test/helpers/config")
const CertStore 	= require("../src/cert-store")
let verbose = false
const tlog = Helpers.testLogger(verbose).log
const Logger = require("../src/logger")
if(verbose){Logger.enable()}else{Logger.disable()}

let serverPort = 9443
let proxyPort = 4001

	async.series([
		// ts_series_tunnel,
		ts_series_slave,
		// ts_series_sni_slave,
		// ts_parallel_tunnel,
		// ts_parallel_slave,
		// ts_parallel_sni_slave,
	],()=>{
		console.log("test done")
		process.exit()
	})

function ts_series_tunnel(done){ 
	test(9991, 4001, Options, test_series, ()=>{
		done()
	})
}
function ts_series_slave(done){ 
	Options.sni = false;
	test(9443, 4001, Options, test_series, ()=>{
		done()
	})
}
function ts_series_sni_slave(done){ 
	Options.sni = true;
	test(9443, 4001, Options, test_series, ()=>{
		done()
	})
}
function ts_parallel_tunnel(done){ 
	test(9991, 4001, Options, test_parallel, ()=>{
		done()
	})
}
function ts_parallel_slave(done){ 
	Options.sni = false;
	test(9443, 4001, Options, test_parallel, ()=>{
		done()
	})
}
function ts_parallel_sni_slave(done){ 
	Options.sni = true;
	test(9443, 4001, Options, test_parallel, ()=>{
		done()
	})
}

function test(serverPort, proxyPort, Options, testFunc, done){
	let remote = null;
	let mitm = null;
	testFunc(serverPort, proxyPort, ()=>{ 
			done()
	})
	return;
	Helpers.startHTTPSServers(serverPort, proxyPort, Options, (r, m)=>{
		remote = r; mitm = m;
		testFunc(serverPort, proxyPort, ()=>{ 
			Helpers.closeServers(remote, mitm, ()=>{
				console.log("XX servers closed")
				done()
			})
		})
	})
}

function test_parallel(serverPort, proxyPort, done){
	let requests = getRequests(serverPort, proxyPort)
	async.parallel(requests, ()=>{
		console.log("test_parallel complete")
		done()
	})
}


function test_series(serverPort, proxyPort, done){
	let requests = getRequests(serverPort, proxyPort)
	async.series(requests, ()=>{
		console.log("test_series_2 complete")
		done()		
	})
}

function HttpsRequest(hostname, serverPort, proxyPort, path, caCert){
	this.requestCounter = 100;
	this.scheme = "https:"
	this.hostname = hostname;
	this.serverPort = serverPort;
	this.proxyPort = proxyPort;
	this.path = path;
	this.caCert = caCert;
	this.targetUrl = this.scheme+"//"+this.hostname+":"+this.serverPort+this.path
	this.proxyUrl = "http:"+"//"+this.hostname+":"+this.proxyPort+this.path
	
	this.getOptions = function(){
		let opts = {
			method: "GET",
			url : this.targetUrl,
			proxy: this.proxyUrl,
			rejectUnauthorized : false,
			ca : caCert,
			headers:{
				"marvin-scheme":"https:",
				"marvin-host":this.hostname,
				"marvin-port":this.serverPort,
				"marvin-uid": ""
			}
		}
		return opts;
	}
	
	this.run = function(done){
		this.counter++;
		let uid = this.hostname+":"+this.serverPort+":"+this.proxyPort+":"+this.path+":"+this.counter
		let opts = this.getOptions();
		opts.headers["marvin-uid"] = uid;
		
		request(opts, (err, res, body)=>{
			tlog("HttpsRequestObject::doRequest::uid[ %s ] got a response", uid, res, err);
			done();
			return
			assert.equal(res.statusCode, 200) // successful request
			let bodyObj = JSON.parse(body)
			assert.notEqual(bodyObj,null)
			assert.equal(bodyObj.method, "GET")
			assert.equal(bodyObj.headers.host, this.hostname+":"+this.serverPort)
			let h = bodyObj.headers
			assert.equal(h['marvin-scheme'],"https:")
			assert.equal(h['marvin-host'],this.hostname)
			assert.equal(h['marvin-port'],this.serverPort)
			assert.equal(h['marvin-uid'],uid)
			done();
		})
	}
	
}

function getRequests(serverPort, proxyPort){
	
	let requests = [];
	let targetUrl = "https://localhost:"+serverPort+"/test"
	let proxyUrl = "http://localhost:"+proxyPort
	requests.push(request_1);
	
	let certStore = new CertStore(Options)
	let caCert = certStore.getCACert()
	let r0 = new HttpsRequest("localhost", serverPort, proxyPort, "/test", caCert)
	
	function request_0(done){
		r0.run(done)
	}
	
	function request_1(done){
		tlog("request_1 about to issue a request")
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : caCert,
		}, function(err, res, body){
			tlog("request_1 got a response", err, res.statusCode, body);
			done();
		})
	}
	requests.push(request_2);
	function request_2(done){
		tlog("request_2 about to issue a request")
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : caCert,
		}, function(err, res, body){
			tlog("request_2 got a response", err, res.statusCode, body);
			done();
		})
	}
	requests.push(request_3);
	function request_3(done){
		tlog("request_3 about to issue a request")
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : caCert,
		}, function(err, res, body){
			tlog("request_3 got a response", err, res.statusCode, body);
			done();
		})
	}
	requests.push(request_4);
	function request_4(done){
		tlog("request_4 about to issue a request")
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : caCert,
		}, function(err, res, body){
			tlog("request_4 got a response", err, res.statusCode, body);
			done();
		})
	}
	requests.push(request_5);
	function request_5(done){
		tlog("request_5 about to issue a request")
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : caCert,
		}, function(err, res, body){
			tlog("request_5 got a response", err);
			done();
		})
	}
	return [
		request_0,
		request_1,
		// request_2,
		// request_3,
		// request_4,
		// request_5,
	]
	return requests
}

