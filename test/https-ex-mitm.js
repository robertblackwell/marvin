/*
* This test simple fires off a lot of requests using the proxy feature of request({})
* IN this case we do have an intermediate mitm server
* The ports are assigned to ensure that all mitm traffic is done with anonymous tunnel 
*
* However all these tests have only ONE server at a time and only one hostname
*
* @TODO - set up a test with 6 servers as follows:
*
*	http://localhost:9990 				http://testhost:9990				- normal processing of non HTTPS requests
*	https://localhost:9991 				https://testhost:9991				- all requests will tunnel
*	https://localhost:9443	sni=false 	https://testhost:9443 sni=false		- all requests will use a non-sni slave
*	https://localhost:9943	sni=true	https://testhost:9943 sni=true		- all requests will use sni slave
*
*	NOTE - need to determine IF we can use a hostname other than localhost
*
* 	Next construct requests:
*
*		https GET localhost:9991 proxy thru 4001	
*		https GET localhost:9443 proxy thru 4001	
*		https GET localhost:9943 proxy thru 4001	
*
*		https GET testhost:9991 proxy thru 4001	
*		https GET testhost:9443 proxy thru 4001	
*		https GET testhost:9943 proxy thru 4001	
*
*		http GET localhost:9991 proxy thru 4001	
*
*		https GET testhost:9991 proxy thru 4001	
*
*	now fire off N of these requests where the actual request is selected randonly
*   keep track of how many times each request is fired to ensure (after the event) that good coverage is
*	achieved
*
*	Each request must test the response to see it is correct. Want each request unique enough to ensure
*	we see the correct response for that request - probably by a custom header line for each request
*
*		marvin-scheme: https: | http:
*		marvin-host: localhost | testhost 
*		marvin-port: 9990 | 9991 | 9943 | 9443, 
*		marvin-uid : a unique id for each request instance
*
*/
const assert		= require("assert")
const async 		= require('async')
const url 			= require('url')
const request 		= require('request')
const util			= require("util")
const fs 			= require('fs')
const inspect 		= require("util").inspect
const http 			= require("http")
const https 		= require("https")
const process		= require('process')
const _ 			= require("underscore")

const Mitm 			= require("mitm-server")
const TestServers 	= require("test/helpers/test-servers")
const Helpers 		= require("test/helpers/functions")
const Options		= require("test/helpers/config")
const CertStore 	= require("cert-store")
const Logger 		= require("logger")

let verbose = true
const tlog = Helpers.testLogger(verbose).log
if(!verbose){Logger.enable()}else{Logger.disable()}

let serverPort = 9991
let proxyPort = 4001

	async.series([
		ts_series_tunnel,
		ts_series_slave,
		ts_series_sni_slave,
		ts_parallel_tunnel,
		ts_parallel_slave,
		ts_parallel_sni_slave,
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
			tlog("HttpsRequestObject::doRequest::uid[ %s ] got a response", uid, err, res.statusCode, body);
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
		const certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		const ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : ca,
		}, function(err, res, body){
			tlog("request_1 got a response", err, res.statusCode, body);
			done();
		})
	}
	requests.push(request_2);
	function request_2(done){
		tlog("request_2 about to issue a request")
		const certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		const ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : ca,
		}, function(err, res, body){
			tlog("request_2 got a response", err, res.statusCode, body);
			done();
		})
	}
	requests.push(request_3);
	function request_3(done){
		tlog("request_3 about to issue a request")
		const certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		const ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : ca,
		}, function(err, res, body){
			tlog("request_3 got a response", err, res.statusCode, body);
			done();
		})
	}
	requests.push(request_4);
	function request_4(done){
		tlog("request_4 about to issue a request")
		const certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		const ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : ca,
		}, function(err, res, body){
			tlog("request_4 got a response", err, res.statusCode, body);
			done();
		})
	}
	requests.push(request_5);
	function request_5(done){
		tlog("request_5 about to issue a request")
		const certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		const ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request({
			method: "GET",
			url : targetUrl,
			proxy: proxyUrl,
			rejectUnauthorized : false,
			ca : ca,
		}, function(err, res, body){
			tlog("request_5 got a response", err);
			done();
		})
	}
	return [
		request_0,
		request_1,
		request_2,
		request_3,
		request_4,
		request_5,
	]
	return requests
}

