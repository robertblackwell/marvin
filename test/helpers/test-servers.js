const http 	= require("http")
const https 	= require("https")
const dispatcher = require('httpdispatcher')
const fs = require('fs')
const url = require('url')

const testServerOptions = {
  key: fs.readFileSync(__dirname + '/../helpers/certs/server-key.pem'),
  cert: fs.readFileSync(__dirname + '/../helpers/certs/server-cert.pem')
};


function testDefinePaths(dispatcher){
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


function createHttp(){
	return _createHttp(testDefinePaths)
}
function _createHttp(definePaths)
{
	definePaths(dispatcher)
	var server = http.createServer(function(req, resp){
		dispatcher.dispatch(req, resp)
	})
	return server;
}

function createHttps(){
	return _createHttps(testServerOptions, testDefinePaths)
}

function _createHttps(options, definePaths)
{
	definePaths(dispatcher)	
	const keyFn = __dirname+"/certs/server-key.pem";
	const certFn = __dirname+"/certs/server-cert.pem";
	if( options.key === undefined ) options.key = fs.readFileSync(keyFn);
	if( options.cert === undefined ) options.cert = fs.readFileSync(certFn);
	let server = https.createServer(options, function(req, resp){
		// console.log("https test server request ", req.method, req.url)
		dispatcher.dispatch(req, resp)
	})	
	// console.log("createHttps exit")
	return server;
}

module.exports = {
	createHttp : createHttp,
	createHttps: createHttps 
}