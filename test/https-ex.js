/*
* This test simple fires off a lot of requests using both https.request({}) and request({})
* But only to servers without a mitm in the middle.
* But it does demonstrate how to test parallel requests 
*/
const async 	= require('async')
const url 		= require('url')
const request 	= require('request')
const assert 	= require("assert")
const util		= require("util")
const fs 		= require('fs')
const inspect 	= require("util").inspect
const http 		= require("http")
const https 	= require("https")
const process 	= require("process")
const _ 		= require("underscore")

const Mitm 			= require("mitm-server")
const TestServers 	= require("test/helpers/test-servers")
const CertStore 	= require("cert-store")
const Options 		= require("test/helpers/config")
const Helpers 		= require("test/helpers/functions")

let verbose = true
const tlog = Helpers.testLogger(verbose).log
const Logger = require("../src/logger")
if(verbose){Logger.enable()}else{Logger.disable()}

test_parallel_1(()=>{
	console.log("parallel test done")
})

function test_parallel_all(done){
	async.parallel([test_parallel_1, test_parallel_2],()=>{
		console.log("all parallel tests done")
		done()
	})
}
function test_parallel_1(done){
	let requests = getRequests()
	let rs = new RawServer();
	rs.start(()=>{
		async.parallel(requests, ()=>{
			console.log("test_parallel_1 complete")
			rs.stop(()=>{
				done()
			})		
		})
	})
}
function test_parallel_2(done){
	let requests = getRequests()
	let rs = new WithTestServer();
	rs.start(()=>{
		async.parallel(requests, ()=>{
			console.log("test_parallel_2 complete")
			rs.stop(()=>{
				done()
			})		
		})
	})
}


function test_series_all(done){
	async.series([test_1, test_2],()=>{
		console.log("all series tests done")
		done()
	})
}
function test_series_1(done){
	let requests = getRequests()
	let rs = new RawServer();
	requests.unshift(rs.start);
	requests.push(rs.stop)
	async.series(requests, ()=>{
		console.log("test_series_1 complete")
		done()
	})
}
function test_series_2(done){
	let requests = getRequests()
	let rs = new WithTestServer();
	requests.unshift(rs.start);
	requests.push(rs.stop)
	async.series(requests, ()=>{
		console.log("test_series_2 complete")
		done()		
	})
}

function getRequests(){
	
	let requests = [];
	
	let scheme = "https:"
	let hostname = "whiteacorn"
	let serverPort = 9991
	let path = "/test"
	let url = scheme+"//"+hostname+":"+serverPort+path
	
	let certStore = new CertStore(Options)
	const ca = certStore.getCACert();

	let http_opts = {
		protocol : "https:",
		hostname: hostname,
		port: serverPort,
		path: path,
		ca: ca,
		method: 'GET',
		// rejectUnauthorized: false,
		// requestCert: true,
	}
	
	const request_opts = {
		method: "GET",
		url : url,
		// rejectUnauthorized:false,
		ca : ca,
	}
	requests.push(request_1);
	function request_1(done){
		tlog("request_1 about to issue a request")
		https.request(http_opts, function(res){
			tlog("request_1 got a response")
			res.on('data', (chk)=>{
				tlog("request_1 body chunk: ",chk.toString())
			})
			res.on('end',()=>{
				tlog("request_1 end")
				done()
			})
		}).end()
	}
	requests.push(request_2);
	function request_2(done){
		tlog("request_2 about to issue a request")
		const r = https.request(http_opts, function(res){
			tlog("request_2 got a response")
			res.on('data', function(ck){
				tlog("request_2 chunk", ck.toString())
			})
			res.on('end', function(){
				tlog("request_2 end")
				done()
			})
		}).end()
	}
	requests.push(request_3);
	function request_3(done){
		tlog("request_3 about to issue a request")
		const r = https.request(http_opts, function(res){
			tlog("request_3 got a response")
			res.on('data', function(ck){
				tlog(ck.toString())
			})
			res.on('end', function(){
				tlog("request_3 end")
				done()
			})
		}).end()
	}
	requests.push(request_4);
	function request_4(done){
		tlog("request_4 about to issue a request")
		const certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		const ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request(request_opts,
		// request({
		// 	method: "GET",
		// 	url : "https://localhost:9991/test",
		// 	path : "/test", //NOTE Path does not do anything
		// 	ca : ca,
		// },
		function(err, res, body){
			tlog("request_4 got a response", err, res.statusCode, body);
			done();
		})
	}
	requests.push(request_5);
	function request_5(done){
		tlog("request_5 about to issue a request")
		const certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		const ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		request(request_opts, 
		// 	{
		// 	method: "GET",
		// 	// protocol : "https:",
		// 	// hostname: 'localhost',
		// 	// port : 9991,
		// 	url : "https://localhost:9991/test",
		// 	// path : "/test", //NOTE Path does not do anything
		// 	ca : ca,
		// }, 
		function(err, res, body){
			tlog("request_5 got a response", err, res.statusCode, body);
			done();
		})
	}
	return [
		request_1,
		request_2,
		request_3,
		request_4,
	]
}

function RawServer(requests){

	const options = {
	  key: fs.readFileSync(__dirname + '/certificate-store/whiteacorn/key.pem'),
	  cert: fs.readFileSync(__dirname + '/certificate-store/whiteacorn/cert.pem')
	};

	const server = https.createServer(options, function(req, resp){
		tlog(__dirname+" server got a request")
		resp.writeHead(200)
		resp.write("this is a response")
		resp.end()
	
	})
	this.start = function start(done){
		tlog("listen 9991")
		server.listen(9991, "whiteacorn", function(){
			tlog("listen call back")
			done()
		})
	}
	this.stop = function(done){
		tlog("stop called")
		server.close(()=>{
			done();			
		});
	}
}

function WithTestServer(runRequests){

	const definePaths = function definePaths(dispatcher)
	{
		dispatcher.onGet("/", function(req, resp){
			resp.writeHead(200, {'Content-type' : 'text/plain'})
			resp.end("XXXX from test server")
		})
		// Test GET with query string
		dispatcher.onGet("/test", function(req, resp){
			// tlog("GET path /test")
			const bObj = {
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
			// tlog("PUT path /test")
			const bObj = {
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
	
	this.start = function(done){
		remote.listen(9991, "localhost", function(){
			done()
		})
	}
	this.stop = function(done){
		remote.close(()=>{
			console.log("stopping test server")
			done()
		})
	}

}