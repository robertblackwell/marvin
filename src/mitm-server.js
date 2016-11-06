const url = require('url')
const http = require("http")
const EventEmitter = require('events').EventEmitter
const util = require('util')
const extend = util.inherits
const net = require('net')
const _ = require('underscore')

const Logger = require("./logger")
const LogLevels = require("./logger").LogLevels
const logger = require("./logger").createLogger(LogLevels.LOG)
const SlaveMaster = require("./slave-master")
const ForwardingAgent = require("./forwarding-agent")
const MitmReportType = require("./mitm-report-type")
const MitmReport = require("./mitm-report")
/**
* This is the set of default options used by {MitmServer} and the classes/modules it invokes
* @config default_options
*/
const default_options = {
	capture :[	
		RegExp(/^text\/.*$/), 
		RegExp(/^application\/.*$/)
	],
	
	/**
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

const RESULT_TUNNEL="tunnel";
const RESULT_HTTPS_SLAVE="https_slave"

/**
* This is the main entry point to the proxy process. It wires together all the bits 
* required to monitor traffic, select the appropriate processing fo the traffic
* and is the distribution center for sending intercepted traffic to the viewing
* process.
*
* @class MitmServer
*
* @constructor
* @param {Options Object} options
*
*/
var MitmServer = module.exports = function MitmServer(options){
	// Logger.disable();
	// this.options = {};
	logger.log("MitmServer .. starting")
	this.options = Object.assign(default_options, options)
	this.acceptableContent = this.options.capture;
	this.log = logger.log;
	this.collectableContentType = ["text","application"]
	
	this.server = http.createServer();
	logger.log("MitmServer::constructor::createSlaveMaster sni:", this.options)
	logger.log("MitmServer::constructor::createSlaveMaster sni:", options)
	this.slaveMaster = SlaveMaster.create(this.options, this.completionCb.bind(this)) //This is not right @FIX
	
	this.server.on('request', this.forward.bind(this));
	this.server.on("connect", this.handleConnect.bind(this));
	this.server.on("upgrade", this.handleUpgrade.bind(this));
	// console.log(options)
	// require('process').exit()
	EventEmitter.call(this)	
}
MitmServer.prototype.__proto__ =  EventEmitter.prototype;

/**
* Reports a https tunnel event.
* @method reportHttpsTunnel
* @param {string} status
* @param {string} host 
* @param {number} port
* @emits "finish"
*/
MitmServer.prototype.reportHttpsTunnel = function(statusStr, host, port){
	logger.info("MitmServer::reportTunnel::", statusStr, host, port)
	let rept = MitmReport.createHttpsTunnelReport(statusStr, host, port)
	this.emit('finish', rept)
	logger.info("MitmServer::reportTunnel::return")
	return;
	
	// const rept = {
	// 	type : "HttpsTunnel",
	// 	status : status,
	// 	host : host,
	// 	port : port
	// }
	// this.emit('finish', rept)
	// logger.info("MitmServer::reportTunnel::return")
	
}
/**
* Reports a http or https interchage that was intercepted.
* @method reportHttpTransaction
* @param {string} protocol (https: or http:)
* @param {Node::IncomingMessage} req - an https or http request 
* @param {Node::IncomingMessage} resp - an http or https response
* @emits "finish"
*/
MitmServer.prototype.reportHttpTransaction = function(protocol, req, resp){
	logger.info("MitmServer::reportHttpTransaction::", req.headers, resp.headers)
	/**
	* both the req and resp are of type IncomingMessage which contains way too much
	* irrelevant data, here we will strip them down to the essential
	*/
	let report = MitmReport.createHttpTransactionReport(protocol, req, resp)
	this.emit('finish', report)
	logger.info("MitmServer::reportHttpTransaction::return")
	
}
MitmServer.prototype.completionCb = function(protocol, req, resp){
	this.reportHttpTransaction(protocol, req, resp)
}

/**
* We have a CONNECT request - so what are we going to do? This method works that out and returns 
* a code to tell the outside world
*
* @method determineConnectAction
* @param {Node::IncomingMessage}req - incoming client request
* @return {string} possible values:
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
	const targetPort = parseInt(tmp[1]);
	const targetHost = tmp[0];
	
	let isHttpConnectPort = this.options.http_ports.includes(targetPort);
	let isHttpsPort = this.options.https_ports.includes(targetPort);
	
	logger.info("MitmServer::determineConnectAction isHttpsPort : ", targetPort, isHttpsPort)
	logger.info("MitmServer::determineConnectAction ", req.url)
	logger.info("MitmServer::determineConnectAction ", req.headers)
	logger.info("MitmServer::determineConnectAction ", this.options.https_ports)

	logger.info("MitmServer::determineConnectAction ", pUrl)
	logger.info("MitmServer::determineConnectAction port : " + targetPort + " host: " + targetHost)

	let result = RESULT_TUNNEL; // this is the catchall outcome

	if( !isHttpConnectPort && ! isHttpsPort ){
		/*
		* We know nothing special about this port so the best we can do is tunnel
		*/
		logger.debug("MitmServer::determineConnectAction return tunnel if", isHttpConnectPort, isHttpsPort)
		result = RESULT_TUNNEL;
	}else if(isHttpConnectPort && ! isHttpsPort ){
		/*
		* We are probably being asked to tunnel a ws connection. Will know for sure when we get
		* the upgrade request which should be the next request from this client.
		* FOR THE MOMENT - LETS JUST IGNORE THIS COMPLEXITY
		*/
		logger.debug("MitmServer::determineConnectAction return tunnel http port")
		result = RESULT_TUNNEL;
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
		logger.debug("MitmServer::determineConnectAction return http_slave")
		result=RESULT_HTTPS_SLAVE;
	}
	logger.info("MitmServer::determineConnectAction return: [%s]", result)
	return result;
}

/**
*/
MitmServer.prototype.forward = function(req, resp){
	logger.log("MitmServer::forward handle request ", req.url )
	let  fa = new ForwardingAgent("http:", this.options)
	fa.forward(req, resp, (protocol, req, tResp)=>{
		this.completionCb("http:", req, tResp)
		// this.emit('finish', req, tResp)
	})
}

/**
* Sets up a anonymous tunnel for an https request
* @method tunnel
* @param {IncomingMessage} req - incoming client reuqest
* @param {net.Socket} socket - a socket that provides connection to the client
* @param {string} targetHost - the hostname of the target server
* @param {number} targetPort - the port number of the target server
*/
MitmServer.prototype.tunnel = function(req, socket, targetHost, targetPort){
	logger.log("MitmServer::tunnel", targetHost, targetPort)
	let socketToTarget = net.Socket()

	socketToTarget.on('error', (err)=>{
		logger.error("MitmServer::tunnel::socketToTarget::error", err)
		/*
		* Got an error trying to connect or talk to the targetServer
		* reject the connect
		*/
		req.socket.write("HTTP/1.1 404 Connection not established\r\n\r\n")
	})

	req.socket.on('error', (err)=>{
		logger.error("MitmServer::tunnel::req.socket::error", err)
		/*
		* got an error on the connection to the client - just out of here
		*/
	})
	/*
	* Try connecting to the target server. On err 
	*/
	socketToTarget.connect(targetPort, targetHost, ()=>{
		logger.info("MitmServer::tunnel:: connect")
		// if( err ){
		// 	req.socket.write("HTTP/1.1 404 Connection not established\r\n\r\n")
		// 	// log and notify the exception
		// }else{
		// 	socketToTarget.on('error',(err)=>{
		// 		console.log("Error on connection to server")
		// 		// need better logging
		// 	})
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
			// this.reportHttpsTunnel("OK", targetHost, targetPort)
			// this.emit('tunnel', {status: "OK", port: targetPort, host: targetHost})
		// }
	})
	
}

/**
* This method tunnels to one of the https slave servers if it has been determined that this
* https interaction will be captured. 
* @method tunnelToHttpsSlave
* @param {IncomingMessage} req - a request from client in the form of IncomingMessage. WE need the req 
*								so that we can pipe the message body to the slave server
* @param {net.Socket} socket - a socket that provides connection to the client
* @param {string} targetHost - the hostname of the target server
*/
MitmServer.prototype.tunnelToHttpsSlave = function tunnelToHttpsSlave(req, socket, targetHost){
	/*
	* Ask the slaveMaster for a port (on the localmachine) of a suitable slave HTTPS server.
	* Once we have the port set up a tunnel to it
	*/		
	logger.log("MitmServer::tunnelToHttpsSlave hostname:[ %s ]  type of slave : [%s]", targetHost, this.slaveMaster.constructor.name)
	// console.log("MitmServer::tunnelToHttpsSlave", this.constructor.name, this.slaveMaster)
	this.slaveMaster.getPortForHost(targetHost, (err, port)=>{
		logger.info("MitmServer::returned from getPortForHost", err, port)
		const portToSlave=port;
		if( err ){
			req.socket.write("HTTP/1.1 404 Connection not established\r\n\r\n")
			logger.error("MitmServer::tunnelToHttpsSlave failed to get port for host ", err)
			// log the exception
		}else{
			logger.info("MitmServer::tunnelToHttpsSlave port : ", portToSlave)
			this.tunnel(req, socket, 'localhost', portToSlave);
		}
	})
}
/**
* Called by the server object when a CONNECT request is received. The two options are:
* 	-	if this is an https request and hostname and port are of interest (as determined by
*		https_hostname and https_port in the options object) and the request/response are
*		to be captured then tunnel to a https slave server
*	-	otherwise connect to the hostname::port and tunnel to that connection	
*
* @method handleConnection
* @param {IncomingMessage} req - a request from client in the form of IncomingMessage. WE need the req 
*								so that we can pipe the message body to the slave server
* @param {net.Socket} socket - a socket that provides connection to the client
*/
MitmServer.prototype.handleConnect = function(req, socket){
	logger.info("MitmServer::handleConnect");
	logger.log("MitmServer::handleConnect::req.url: %s req.headers :", req.url, req.headers);
	var tmp = req.url.split(":")
	var targetHost = tmp[0];
	var targetPort = tmp[1];
	var socketToTarget = net.Socket()
	const pUrl = url.parse(req.url)
	
	let action = this.determineConnectAction(req)
	switch(action){
	case RESULT_TUNNEL:
		logger.info("handleConnect - tunnel")
		this.tunnel(req, socket, targetHost, targetPort)
		break;
	case RESULT_HTTPS_SLAVE:
		logger.info("MitmServer::handleConnect", this.constructor.name)
		this.tunnelToHttpsSlave(req, socket, targetHost)
		break;
	default:
		throw Error("actionOnConnect - default [" + action + "]")
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

MitmServer.prototype.handleUpgrade = function(req, resp){
	throw Error("Upgrade not implemented")
}

MitmServer.prototype.listen = function(proxyPort, proxyServername, cb){
	logger.log("MitmServer::listening ", proxyPort, proxyServername)
	this.proxyPort = proxyPort
	this.proxyHost = proxyServername
	this.server.listen(this.proxyPort, proxyServername, cb)
}

MitmServer.prototype.close = function(cb){
	logger.log("MitmServer::close ")
	this.server.close(cb)
}


