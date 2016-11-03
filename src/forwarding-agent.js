const url = require('url')
const http = require("http")
const https = require("https")
const _ = require("underscore")
const connectionManager = require("./connection-manager")
const LogLevels = require("./logger").LogLevels
const logger = require("./logger").createLogger(LogLevels.DEBUG)


const default_options = {
	capture :[	
		RegExp(/^text\/.*$/), 
		RegExp(/^application\/.*$/)
	],
	
}

/**
* This class implements the proxy forwarding process for http/https protocols.
* Takes a client req (IncomingMessage), 
*	-	modifies headers as necessary, 
*	-	passes it up to the target server,
* 	-	gets the response from the target server
*	-	modifies that response as necessary
*	-	sends it down to the originating client
*	-	and notifies the http(s) transaction - say more about this
* @class ForwardingAgent
*/
module.exports = class ForwardingAgent{
	/**
	* @constructor
	* @param {string} protocol - one of https: http:
	* @param {Options object} options
	*/
	constructor(protocol, options){
		this.protocol = protocol
		this.options = Object.assign(default_options, options)
		this.acceptableContent = this.options.capture;
		this.collectableContentType = ["text","application"]
	}
	/**
	* This method does all the heavy lifting of the proxying or request forwarding
	* process and also provides to hook for extracting the request/response for monitoring.
	*
	* The procss is roughly as follows:
	*	-	take the initial client request "req" (of type IncomingMessage) and from this construct a 
	*		(maybe modified) request to the target server. This will at least involve taking the proxy stuff out of
	*		the headers.
	*
	*	-	when the response (of type IncomingMessage) arrives from the target server, from it build (fill in the details of)
	*		the response "resp" (of type ServerResponse )that is destined for the initial client
	*		and again there might be some header modifications.
	*
	*	-	once the response to the initial client signals "finish" - meaning all responsibility for this response 
	*		has passed to the OS signal the outside world by triggering a "finish" event on the 
	*		
	*		Mitm object - @TODO - this is not the correct object now
	*
	*		so watches can log the transaction. The event name "finish" is probably a bit unfortunate
	*
	*	-	the finish event handler has signature function(req, res) where
	*		-	req is the original client req of type IncomingMessage to which has been added a rawBody property
	*			of type Buffer
	*		-	res is the response from the target server of type IncomingMessage to which (in selected cases) has
	*			been added a property rawBody. The rawBody is only added if this.shouldCollectResponseBody() returns true
	* @method forward
	* @param 	{Node::IncomeingMessage} req  	- 	the request message from the original client
	* @param 	{Node::ServerResponse}  resp	- 	the response to be sent to the initial client
	* @param 	{function} cb						signals http(s) transaction complete		-	@todo - FIX
	*/
	forward(req, resp, cb)
	{
		/**
		* Parse the url in prep for forwarding the request upstream
		* This stuff is still a problem 
		*/
		let pUrl = url.parse(req.url)
		let hostname = pUrl.hostname
		let port = pUrl.port
		let path = pUrl.path
		let headerHostname = req.headers['host']
		let headerPort = req.headers['port']
		let tmp = headerHostname.split(":")
		if(tmp.length == 2) {
			hostname = headerHostname = tmp[0]
			port = headerPort = tmp[1]
		}
		logger.log("ForwardingAgent::forward protocol:[%s] hostname:[%s] port:[%d] ", this.protocol, hostname, port)
		logger.debug("ForwardingAgent::forward::port: ", port)
				
		logger.debug("ForwardingAgent::forward::req.method", req.method)
		logger.debug("ForwardingAgent::forward::url", pUrl)
		logger.debug("ForwardingAgent::forward::hostname: ", hostname)
		logger.debug("ForwardingAgent::forward::port: ", port)
		logger.debug("ForwardingAgent::forward::path: ", path)
		logger.debug("ForwardingAgent::forward::headerHostname: ", headerHostname)
		logger.debug("ForwardingAgent::forward::headerPort: ", headerPort)
		/**
		* strip out headers that should not be passed upstream and add any procy headers
		* that should be added. 
		* @TODO - research what else I have to do
		*/
		var reqHeaders = {"mitm": "upstream-req"}; 
		Object.assign(reqHeaders, req.headers);
		var newHeaders = {"mitm": "upstream-req"};
	
		_.each(reqHeaders, (value, key, list) =>{
			// logger.info("key: " + key + "  value: " + value + " test : " + ({'host':true,'port':true}[key]))
			if( {'host':true,'port':true}[key] !== true )
				newHeaders[key] = value
		})
		
		delete reqHeaders['host'];
		delete reqHeaders['port'];
		// logger.info(["after mod headers"])
		// logger.info(reqHeaders)
		// logger.info(newHeaders)
		// process.exit()
	 
	/**
	* This is a hack and needs to be fixed @FIX
	*/
		let options = {
			protocol : this.protocol,
			hostname : hostname,
			port: port,
			path : path,
			method : req.method,
			headers : reqHeaders
		}
		if( this.protocol === "https:"){
			options.rejectUnauthorized = false;
			// options.ca = ca @TODO
		}
		// logger.info("ForwardingAgent::forward::request options", options)
		// options = {
		// 	protocol: "https:",
		// 	hostname : "localhost",
		// 	port: 9443,
		// 	path : "/test",
		// 	method : "GET",
		// 	rejectUnauthorized: false,
		// 	headers : reqHeaders
		//
		// }
		logger.info("ForwardingAgent::forward::request options", options)
	
		/**
		* This should be easier - lets try promises so that it looks like
		*
		*	getConnection(protocol, host, port)
		*	.then(sendUpstreamRequest) 						
		*	.then(decodeUpStreamResponseAndSendToClient)	
		*	.then(notifyHttpTransactionFinished)
		*/
		const upstreamCallback = (targetServerResponse)=>{
			/**
			* modify the reponse if necessary. At this time only add a mitm header to
			* so the forwarding process can be detected
			*/
			targetServerResponse.headers['mitm'] = "upstream-resp"
		
			/**
			* now send the response downstream to the original client
			*/
			resp.writeHead(targetServerResponse.statusCode, targetServerResponse.headers)
			/**
			* forward the response body downstream
			* and possibly collect the response body provided the content-type is appropriate
			* do this here to ensure we dont try collecting the contents of very large
			* response bodies
			* other cleaning up of the request body and response body for display purposes
			* can take place elsewhere
			*/
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
				/**
				* at this point the entire req/resp cycle is over so package it up 
				* and send a "notification" to who-ever. 
				* @NOTE - assumes "this" is the Mitm object
				*/
				logger.info("ForwardingAgent::finish")
				cb(this.protocol, req, targetServerResponse)
			})
		}
		if( pUrl.port) options.port = pUrl.port;
		/**
		* get a connection and when we have it send the request upstream
		*/
		var conn = connectionManager.getConnectionForHostPort("http", pUrl.hostname, options.port, (err, conn)=>{
			if( err ){
				throw new Error("getConnectionForHostPort failed host :" + host + " port: " + port)
			}
			// var upStreamReq = conn.httpRequest( options, upstreamCallback )
			var upStreamReq = (this.protocol === "https:") 
				? https.request( options, upstreamCallback )
				: http.request( options, upstreamCallback )
			
			upStreamReq.on('error', (e) => {
				/**
				* Need to do something better with this
				*/
			  logger.error(`problem with request: ${e.message}`);
			});
	
			/**
			* pipe the request body upstream to the target server
			* and also save the request body
			*/
			pipeAndCollectStreamContent(req, upStreamReq, (content)=>{
				req.rawBody = content; // also a the same hack - add the raw body dynamically to the request 
				upStreamReq.end(); // not sure about this -- maybe the pipe does this for me
			})
		
		})
		// var upStreamReq = conn.sendHttpRequest( options, upstreamCallback )
		//
		// upStreamReq.on('error', (e) => {
		// 	/**
		// 	* Need to do something better with this
		// 	*/
		//   logger.info(`problem with request: ${e.message}`);
		// });
		//
		// /**
		// * pipe the request body upstream to the target server
		// * and also save the request body
		// */
		// pipeAndCollectStreamContent(req, upStreamReq, (content)=>{
		// 	req.rawBody = content; // also a the same hack - add the raw body dynamically to the request
		// 	upStreamReq.end(); // not sure about this -- maybe the pipe does this for me
		// })
	}
	/**
	* Determine what types of response content we want to collect and signal
	* on a finish event. The goal here is ONLY to prevent collecting into a buffer a 
	* large reponse body that we will probably never look at.
	* For example - Probably do not want to collect image/ video/ audio/ types of content
	* Put another way only text/*  and application/* will be collected
	* @method shouldCollectResponseBody
	* @param {IncomingMessage} res - response from upstream server 
	*/
	shouldCollectResponseBody(res /*IncomingMessage*/)
	{
		var result = false;
		if( res.headers['content-type'] === undefined ){
			logger.debug("ForwardingAgent::shouldCollectResponseBody there is NO content type")
			result = true;
		}else{
			var c_type = res.headers['content-type']
			logger.debug("ForwardingAgent::shouldCollectResponseBody content type is ", res.headers['content-type'])
			this.acceptableContent.forEach((re)=>{
				// var re = new Regex(reStr)
				logger.debug("ForwardingAgent::shouldCollectResponseBody::matching loop", c_type, (c_type.match(re)!== null) )
				if( c_type.match(re) !== null ){
					result = true;
				}
			})
		}
		logger.debug("ForwardingAgent::shouldCollectResponseBody result", result)
		return result;
	}
	
}

/**
* A utility function that in one operation pipes rStream into wStream and 
* (optionally) collects the contents of the rStream into a buffer and passes it to the
* cb function.
*
* If cb === null dont collect the contents
* @function pipeAndCollectStream
* @param {ReadableStream} rStream - readable stream
* @param {WriteableStream} wStream - a writeable stream
* @param cb - function with signture (Buffer). If null - dont collect the data
*/
function pipeAndCollectStreamContent(rStream, wStream, cb)
{
	let buffers = [];
	rStream.pipe(wStream);
	if( cb ){
		rStream.on('data', function(chunk){
			buffers.push(chunk)
		})
		rStream.on('end', function(){
			const streamContent = Buffer.concat(buffers)
			cb(streamContent)
		})
	}
}