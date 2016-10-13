var http 	= require("http")
var https 	= require("https")
var dispatcher = require('httpdispatcher')
var fs = require('fs')

function createHttp(definePaths)
{
	definePaths(dispatcher)
	var server = http.createServer(function(req, resp){
		dispatcher.dispatch(req, resp)
	})
	return server;
}

function createHttps(options, definePaths)
{
	definePaths(dispatcher)	
	var keyFn = __dirname+"/certs/server-key.pem";
	var certFn = __dirname+"/certs/server-cert.pem";
	if( options.key === undefined ) options.key = fs.readFileSync(keyFn);
	if( options.cert === undefined ) options.cert = fs.readFileSync(certFn);
	var server = https.createServer(options, function(req, resp){
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