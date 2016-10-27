var url = require('url')
var http = require("http")
var EventEmitter = require('events').EventEmitter
var util = require('util')
var extend = util.inherits
var net = require('net')
var _ = require('underscore')
var SlaveMaster = require("./slave-master")
var connectionManager = require("./connection-manager")
var logger = console



/**
* A utility function that in one operation pipes rStream into wStream and 
* (optionally) collects the contents of the rStream into a buffer and passes it to the
* cb function.
*
* If cb === null dont collect the contents
*
* @param rStream - readable stream
* @param wStream - a writeable stream
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

function tunnel(socket_1, socket_2){
	
}

const default_options = {
	capture :[	
		RegExp(/^text\/.*$/), 
		RegExp(/^application\/.*$/)
	],
	
	/*
	* these options control how the proxy handles CONNECT requests
	* any CONNECT to one of the given https_ports is treated as a https proxy request
	* if the hostname is NOT matched by on of the entries in the array of host regexs
	* then an anonymous tunnel to established
	* If a hostname IS matched then the traffic from the client is tunneled to the 
	* backend https server and the request and response are captured 
	* A CONNECT to one of the http_ports is probably the start of a WS/WSS handshake
	* DONT KNOW HOW TO HANDLE THAT AT THE MOMENT 
	*/
	http_ports	: [80, 8080, 9980], 	//ports that will trigger an HTTP(no S) proxy
	https_ports	: [443,9443], 			//ports that will trigger an https_note_the_s proxy
	https_hosts	: [RegExp(/^.*$/)],		//regex to identify hosts that should invoke https mitm

}

var MitmServer = module.exports = function MitmServer(options){
	// this.options = {};
	this.options = Object.assign(default_options, options)
	this.acceptableContent = this.options.capture;
	this.log = logger.log;
	this.collectableContentType = ["text","application"]
	
	this.server = http.createServer();
	this.slaveMaster = new SlaveMaster(this.options, this.forward.bind(this))
	this.server.on('request', this.forward.bind(this));
	this.server.on("connect", this.handleConnect.bind(this));
	this.server.on("upgrade", this.handleUpgrade.bind(this));
	// console.log(options)
	// require('process').exit()
	EventEmitter.call(this)
	
}
MitmServer.prototype.__proto__ =  EventEmitter.prototype;

/*
* We have a CONNECT request - so what are we going to do?
* @param req IncomingMessage
* @return - STRING, possible values:
*
*	-	"tunnel" 		- set up a transparent tunnel between the client socket and the target server
*	-	"https_slave"	- its a https CONNECT that we want to monitor - tunnel to a https slave that will monitor traffic
*	
*	@note - currently not sure how to handle ws/wss CONNECT requests
*
*/
MitmServer.prototype.determineConnectAction = function(req){
	const pUrl = url.parse(req.url);
	const hName = pUrl.hostname;
	const protocol = pUrl.protocol;
	
	const tmp = req.url.split(":")
	const targetPort = tmp[1];
	
	let isHttpConnectPort = this.options.http_ports.includes(targetPort)
	let isHttpsPort = this.options.https_ports.includes(targetPort)
	if( !isHttpConnectPort && ! isHttpsPort ){
		/*
		* We know nothing special about this port so the best we can do is tunnel
		*/
		return "tunnel"
	}else if(isHttpConnectPort && ! isHttpsPort ){
		/*
		* We are probably being asked to tunnel a ws connection. Will know for sure when we get
		* the upgrade request which should be the next request from this client.
		* FOR THE MOMENT - LETS JUST IGNORE THIS COMPLEXITY
		*/
		return "tunnel";
	}
	
	let isHttpsHostname = false;
	this.options.https_hosts.forEach((re)=>{
		if( hName.match(re) != null){
			isHttpsHostname = true;
		}
	})
	if( isHttpsPort && isHttpsHostname){
		/**
		* Its a https connect request that we are going to MITM
		*/
		return "https_slave";
	}
	/**
	* Catchall
	*/
	return "tunnel";
}

MitmServer.prototype.tunnel = function(req, socket, targetHost, targetPort){
	let socketToTarget = net.Socket()

	socketToTarget.on('error', (err)=>{
		/*
		* Got an error trying to connect or talk to the targetServer
		* reject the connect
		*/
		req.socket.write("HTTP/1.1 404 Connection not established\r\n\r\n")
	})

	req.socket.on('error', (err)=>{
		/*
		* got an error on the connection to the client - just out of here
		*/
	})
	/*
	* Try connecting to the target server. On err 
	*/
	socketToTarget.connect(targetPort, targetHost, (err)=>{
		if( err ){
			req.socket.write("HTTP/1.1 404 Connection not established\r\n\r\n")
			// log and notify the exception
		}else{
			socketToTarget.on('error',(err)=>{
				console.log("Error on connection to server")
				// need better logging
			})
			/*
			* No establish tunnel via twoway pipe
			*/
			req.socket.pipe(socketToTarget);
			socketToTarget.pipe(req.socket);
			/*
			* give the client the OK to start
			*/
			req.socket.write("HTTP/1.1 200 Connection established \r\n\r\n")
			/*
			* emit/notify the world of the tunnel transaction
			*/
			// log the tunnel request and OK
			this.emit('tunnel', {status: "OK", port: targetPort, host: targetHost})
		}
	})
	
}
MitmServer.prototype.tunnelToHttpsSlave = function tunnelToHttpsSlave(req, socket, targetHost){
	/*
	* Ask the slaveMaster for a port (on the localmachine) of a suitable slave HTTPS server.
	* Once we have the port set up a tunnel to it
	*/		
	this.slaveMaster.getPortForHost(targetHost, (err, port)=>{
		const portToSlave=port;
		if( err ){
			req.socket.write("HTTP/1.1 404 Connection not established\r\n\r\n")
			// log the exception
		}else{
			this.tunnel(req, socket, 'localhost', portToSlave);
		}
	})
}
MitmServer.prototype.handleConnect = function(req, socket)
{
	// this.log("MitmServer::handleConnect");
	var tmp = req.url.split(":")
	var targetHost = tmp[0];
	var targetPort = tmp[1];
	var socketToTarget = net.Socket()
	const pUrl = url.parse(req.url)
	
	let action = this.determineConnectAction(req)
	switch(action){
	case "tunnel":
		this.tunnel(req, socket, targetHost, targetPort)
		break;
	case "https_slave":
		this.tunnelToHttpsSlave(req, socket, targetHost)
		break;
	default:
		throw Error("actionOnConnect - default")
		break;	
	}
	return;
	/**
	* Need to decide how to handle the CONNECT
	*/
	// Is it https through slave ? must be https port and https hostname
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

MitmServer.prototype.handleUpgrade = function(req, resp)
{
	throw Error("Upgrade not implemented")
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
* @param res IncomingMessage
*/
MitmServer.prototype.shouldCollectResponseBody = function(res /*IncomingMessage*/)
{
	var result = false;
	if( res.headers['content-type'] === undefined ){
		// console.log("shouldCollect there is NO content type")
		result = true;
	}else{
		var c_type = res.headers['content-type']
		// console.log("shouldCollect content type is ", res.headers['content-type'])
		this.acceptableContent.forEach((re)=>{
			// var re = new Regex(reStr)
			// console.log("matching loop", c_type, (c_type.match(re)!== null) )
			if( c_type.match(re) !== null ){
				result = true;
			}
		})
	}
	// console.log("shouldCollectResponseBody", result)
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
MitmServer.prototype.forward = function forward(req, resp)
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

