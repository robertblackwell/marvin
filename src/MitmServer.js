var url = require('url')
var http = require("http")
var EventEmitter = require('events').EventEmitter
var util = require('util')
var extend = util.inherits
var net = require('net')
var logger = console



//
// A utility function that in one operation pipes rStream into wStream and 
// (optionally) collects the contents of the rStream into a buffer and passes it to the
// cb function.
//
// If cb === null dont collect the contents
//
function pipeAndCollectStreamContent(rStream, wStream, cb)
{
	var buffers = [];
	var streamContents
	rStream.pipe(wStream);
	if( cb ){
		rStream.on('data', function(chunk){
			buffers.push(chunk)
		})
		rStream.on('end', function(){
			streamContent = Buffer.concat(buffers)
			cb(streamContent)
		})
	}
}

function tunnel(socket_1, socket_2){
	
}

var MitmServer = module.exports = function MitmServer(options){
	this.log = logger.log;
	this.collectableContentType = ["text","application"]
	this.server = http.createServer();
	this.server.on('request', this.handleRequest.bind(this));
	this.server.on("connect", this.handleConnect.bind(this));
	EventEmitter.call(this)
	
}
MitmServer.prototype.__proto__ =  EventEmitter.prototype;

MitmServer.prototype.handleConnect = function(req, socket)
{
	// this.log("MitmServer::handleConnect");
	var tmp = req.url.split(":")
	var targetHost = tmp[0];
	var targetPort = tmp[1];
	var socketToTarget = net.Socket()
	// console.log("connectHandler ", targetPort, targetHost )
	
	socketToTarget.on('error', (err)=>{
		req.socket.write("HTTP/1.1 404 Connection not established\r\n\r\n")
		// req.end();
		// socketToTarget.close()
	})
	req.socket.on('error', (err)=>{
		// req.end();
		// socketToTarget.close()
	})
	socketToTarget.connect(targetPort, targetHost, (err)=>{
		req.socket.pipe(socketToTarget);
		socketToTarget.pipe(req.socket);
		req.socket.write("HTTP/1.1 200 Connection established \r\n\r\n")
		this.emit('tunnel', {status: "OK", port: targetPort, host: targetHost})
		
	})

}

MitmServer.prototype.handleRequest = function(req, resp)
{
	this.forward(req, resp)
}

MitmServer.prototype.listen = function(proxyPort, proxyServername, cb){
	this.proxyPort = proxyPort
	this.proxyHost = proxyServername
	this.server.listen(this.proxyPort, proxyServername, cb)
}
MitmServer.prototype.close = function(cb){
	this.server.close(cb)
}

/**
* Determine what types of response content we want to collect and signal
* on a finish event. The goal here is ONLY to prevent collecting into a buffer a 
* large reponse body that we will probably never look at.
* For example - Probably do not want to collect image/ video/ audio/ types of content
* Put another way only text/*  and application/* will be collected
*/
MitmServer.prototype.shouldCollectResponseBody = function(res /*IncomingMessage*/)
{
	var result = false;
	var acceptableContent = [
		RegExp(/^text\/.*$/), 
		RegExp(/^application\/.*$/)
	];
	console.log("content-type", res.headers['content-type'])
	if( res.headers['content-type'] === undefined ){
		// console.log("shouldCollect there is NO content type")
		result = true;
	}else{
		var c_type = res.headers['content-type']
		// console.log("shouldCollect content type is ", res.headers['content-type'])
		acceptableContent.forEach((re)=>{
			// var re = new Regex(reStr)
			console.log("matching loop", c_type, (c_type.match(re)!== null) )
			if( c_type.match(re) !== null ){
				result = true;
			}
		})
	}
	console.log("shouldCollectResponseBody", result)
	return result;
}
MitmServer.prototype.getCollectableContentTypes = function()
{
	return this.collectableContentTypes;
}
MitmServer.prototype.setCollectableContentTypes = function(config)
{
	this.collectableContentType = config;
}


/**
* This method does all the heavy lifting of the proxying process and also provides to hook
* for extracting the request/response for monitoring.
*
* The procss is roughly as follows:
*	-	take the initial client request "req" (of type IncomingMessage) and from this construct a 
*		maybe modified request to the target server. This will at least involve taking the proxy stuff out of
*		the headers
*	-	with the response from the target server complete the response "resp" that is destined for the initial client
*		again there might be some header modifications.
*
*	-	once the response to the initial client signals "finish" - meaning all responsibility for this response 
*		has passed to the OS signal the outside world by triggering a "finish" event.
*
*	-	the finish event handler has signature function(req, res) where
*		-	req is the original client req of type IncomingMessage to which has been added a rawBody property
*			of type Buffer
*		-	res is the response from the target server of type IncomingMessage to which (in selected cases) has
*			been added a property rawBody
*/
MitmServer.prototype.forward = function forward(req, resp)
{
	var pUrl = url.parse(req.url)
	var options = {
		hostname : pUrl.hostname,
		path : pUrl.path,
		method : req.method
	}
	if( pUrl.port) options.port = pUrl.port;
	
	// save the request meta data
	
	// console.log(options)
	var upStreamReq = http.request( 
		options,
		(targetServerResponse)=>{
			// now send the response (with mods) downstream to the original client
			targetServerResponse.headers['Mitm-proxy'] = "versionxx"
			resp.writeHead(targetServerResponse.statusCode, targetServerResponse.headers)
			// forward the response body downstream
			// and possibly collect the response body provided the content-type is appropriate
			// do this here to ensure we dont try collecting the contents of very large
			// response bodies
			// other cleaning up of the request body and response body for display purposes
			// can take place elsewhere
			if( this.shouldCollectResponseBody(targetServerResponse) ){
				pipeAndCollectStreamContent(targetServerResponse, resp, (content)=>{
					targetServerResponse.rawBody = content; // a bit of a hack - add the full captured body dynamically to the response
				})
			}else{
				targetServerResponse.pipe(resp)
				targetServerResponse.rawBody = new Buffer("")
				// pipeAndCollectStreamContent(targetServerResponse, resp, (content)=>{
				// 	targetServerResponse.rawBody = new Buffer("")
				// })
			}
			resp.on('finish', ()=>{
				// at this point the entire req/resp cycle is over so package it up 
				// and send a "notification" to who-ever
				this.emit("finish", req, targetServerResponse)
			})
		})
	upStreamReq.on('error', (e) => {
	  console.log(`problem with request: ${e.message}`);
	});
	
	// pipe the request body upstream to the target server
	// and alo save the request body
	pipeAndCollectStreamContent(req, upStreamReq, (content)=>{
		req.rawBody = content; // also a the same hack - add the raw body dynamically to the request 
	})
}

