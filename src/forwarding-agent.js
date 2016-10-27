/**
* This class implements the proxy forwarding process for http/https protocols.
* Takes a client req (IncomingMessage), 
*	-	modifies headers as necessary, 
*	-	passes it up to the target server,
* 	-	gets the response from the target server
*	-	modifies that response as necessary
*	-	sends it down to the originating client
*	-	and notifies the http(s) transaction - say more about this
*/
class ForwardingAgent{
	constructor(protocol){
		this.protocol = protocol
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
	*		has passed to the OS signal the outside world by triggering a "finish" event on the Mitm object
	*		so watches can log the transaction. The event name "finish" is probably a bit unfortunate
	*
	*	-	the finish event handler has signature function(req, res) where
	*		-	req is the original client req of type IncomingMessage to which has been added a rawBody property
	*			of type Buffer
	*		-	res is the response from the target server of type IncomingMessage to which (in selected cases) has
	*			been added a property rawBody. The rawBody is only added if this.shouldCollectResponseBody() returns true
	*
	* @param req 	IncomeingMessage 	- 	the request message from the original client
	* @param resp	ServerResponse		- 	the response to be sent to the initial client
	* @param this	the Mitm object		-	
	*/
	forward(req, resp)
	{
		/**
		* Parse the url in prep for forwarding the request upstream
		*/
		var pUrl = url.parse(req.url)
	
		/**
		* strip out headers that should not be passed upstream and add any procy headers
		* that should be added. 
		* @TODO - research what else I have to do
		*/
		var reqHeaders = {"mitm": "upstream-req"}; 
		Object.assign(reqHeaders, req.headers);
		var newHeaders = {"mitm": "upstream-req"};
	
		_.each(reqHeaders, (value, key, list) =>{
			// console.log("key: " + key + "  value: " + value + " test : " + ({'host':true,'port':true}[key]))
			if( {'host':true,'port':true}[key] !== true )
				newHeaders[key] = value
		})
		delete reqHeaders['host'];
		delete reqHeaders['port'];
		// console.log(["after mod headers"])
		// console.log(reqHeaders)
		// console.log(newHeaders)
		// process.exit()
	 
		const options = {
			hostname : pUrl.hostname,
			path : pUrl.path,
			method : req.method,
			headers : newHeaders
		}
	
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
			targetServerResponse.headers['Mitm-proxy'] = "versionxx"
		
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
				this.emit("finish", req, targetServerResponse)
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
			var upStreamReq = conn.httpRequest( options, upstreamCallback )

			upStreamReq.on('error', (e) => {
				/**
				* Need to do something better with this
				*/
			  console.log(`problem with request: ${e.message}`);
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
		//   console.log(`problem with request: ${e.message}`);
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