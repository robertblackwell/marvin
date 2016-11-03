var CertStore 	= require("./cert-store")
var https 		= require('https')
var fs 			= require('fs')
var _ 			= require("underscore")
var process 	= require("process")
const LogLevels = require("./logger").LogLevels
const logger = require("./logger").createLogger(LogLevels.LOG)

const ForwardingAgent = require("../src/forwarding-agent")

function hostKey(options, hostname){
	var keyFn = options.certDir+"/"+hostname+"-key.pem";
	return keyFn;	
}
function hostCert(options, hostname){
	var certFn = options.certDir+"/"+hostname+"-cert.pem";
	return certFn;
}

/**
* 	This class controls the creation and access to slave https servers.
*
* 	It exposes a single method 
*
*		getPortForHost(hostname, cb) - cb(err, port)
* 
*	This method will find, or create if necessary, an instance of a https server that
* 	can operate as a server for the given hostname and will return a TCP
* 	port number on which a client can connect to the designated server
*
* 	Two different strategies are available:
*
* 	non-sni (options.sni === undefined or options.sni ===false)
*	===========================================================
*
*	This strategy creates a new slave https server for each hostname/servername
* 	and keep references to those server instances so that they can be re-used.
*	Each server instance operates on behalf of only a signle hostname and
*	is give a key and certificate appropriate to that hostname when it is created
*
*	sni (options.sni===true)
*	========================
*
*	This strategy creates only a single https server instances and has it operate on behalf 
*	of multiple servernames via the SNICallback feature of https.Server.
*	This is the preferred, and default, strategy.
*
*
*	In both cases this class relies on an instance of the CertStore class to manage and when necessary
*	create appropriate signed certificates. See CertStore for more info
* @class HttpsSlaveMaster
*/
class HttpsSlaveMaster { //base class
	
	/**
	* A factory method to construct slave servers
	* @method createHttpsSlaveMaster 
	* @static  
	*/
	static createHttpsSlaveMaster(options, completionCb){
		let m =  _createHttpsSlaveMaster(options, completionCb);
		return m;
	}
	/**
	* @constructor
	* @param {Options object} options
	* @param {function} completionCb - to be called when the forwarding agent has processed a complete request/responbse cycle
	*/
	constructor(options, completionCb){
		logger.log("HttpsSlaveMaster starting")
		this.options = {};
		_.defaults(this.options, options, {
			sni: true,
			log: console.log
		})
		this.certStore = new CertStore(options)
		this.log = this.options.log;
		// this.log = console.log;
		this.sni = (this.options.sni !== undefined && this.options.sni === true)
		logger.log("HttpsSlaveMaster::constructor::sni " + this.sni)
		this.servers = {};
		
		this.slave = undefined;
		
		this.pending = (this.sni)? []: {};
		
		this.serverCount = 0;
		this.completionCb = completionCb;
		logger.debug("HttpsSlaveMaster - constructor complete", this)
	}
	/**
	* Forward the clients request upstream to the originally intended server
	* @param {IncomingMessage} res
	* @param {ServerRespsonse} resp
	* @uses an instance of {ForwardingAgent} to perform this action
	*/
	forwardRequest(req, resp){
		logger.info("HttpsSlave forwarding request url:", req.url)
		logger.info("HttpsSlave forwarding request headers:",  req.headers)
		
		const fa = new ForwardingAgent("https:", this.options)
		req.headers['slave'] = this.whoAmI
		fa.forward(req, resp, (protocol, tReq, tResp)=>{
			logger.info("HttpsSlave forward callback")
			tReq.headers['slave'] = this.whoAmI
			tResp.headers['slave'] = this.whoAmI
			this.completionCb(protocol, tReq, tResp)
			logger.info("HttpsSlave forward callback - return")
		})
		return;
		// this.handler(req, resp)
		logger.info("HttpsSlave server got a request")
		resp.writeHead(200)
		resp.end("OK got here")						
	}
}
/**
* A HttpsSlaveMaster derived class that can operate on behalf of multiple host names. 
* @class SniSlaveMaster
*/
class SniSlaveMaster extends HttpsSlaveMaster
{
	constructor(options, handler){
		super(options, handler)
		this.whoAmI = "SniSlaveMaster"
	}
	/**
	* Get a port on the local system through which a suitable slave server can be
	* communicated with 
	* @method getPortForHost
	* @param {string} hostname
	* @param {function} cb - to be called when the port has been obtained 
	*/
	getPortForHost(hostname, cb)	{
		var slave;
		logger.log("SniSlaveMaster::sniGetPortForHost", hostname)
		
		if( this.slave === undefined ){ 
			this.pending.push(cb);
			if( this.pending.length != 1 ){
				logger.info("getPort already pending ", this.pending.length)
				return;
			}

			var server_options = {
				SNICallback : (servername, cb)=>{
					logger.info("SNICallback : ", servername)
					this.certStore.getSecureContext(servername, (err, ctx)=>{
						logger.info("snicallback cb",err)
						cb(err, ctx)
					})
				}
			}
			slave = https.createServer(server_options, this.forwardRequest.bind(this));
			// 	(req, resp)=>{
			// 	this.log("HttpsSlave server got a request")
			// 	resp.writeHead(200)
			// 	resp.end("OK got here")
			// })
			slave.listen(0, "localhost",()=>{
				logger.log("SniSlaveMaster::slave.listen::cb hostname: %s port : %d", hostname, slave.address().port)
				slave.port = slave.address().port
				// Now that we have a port hook slave into this. This signals 
				// that the slave is established
				this.slave = slave
				var callbacks = this.pending;
				this.pending = [];
				logger.info("SniSlaveMaster::slave.listen::cb drain callbacks", callbacks.length)
				for(cb of callbacks ){
					cb(null, this.slave.port)
				}
			})
		}else{
			logger.log("SniSlaveMaster::getPortForHost - reusing", this.slave.port)
			cb(null, this.slave.port)
		}
	}	
	close(){
		this.slave.close()		
	}
}
/**
* A HttpsSlaveMaster derived class, instances of which can operate on behalf of a __single__ host names.
* if this type of slave is used one must be created for each distinct upstream hostname 
* @class PerHostnameSlaveMaster
*/
class PerHostnameSlaveMaster extends HttpsSlaveMaster
{
	constructor(options, handler){
		super(options, handler)		
		this.whoAmI = "PerHostnameSlaveMaster"
	}
	/**
	* Get a port on the local system through which a suitable slave server can be
	* communicated with 
	* @method getPortForHost
	* @param {string} hostname
	* @param {function} cb - to be called when the port has been obtained 
	*/
	getPortForHost(hostname, cb){
		logger.log("PerHostnamesSlaveMaster::getPortForHost", hostname)
		var port;
		var serverOptions;

		if( this.servers[hostname] === undefined){
			logger.log("PerHostnamesSlaveMaster::getPortForHost::Creating server for", hostname)
			if( this.pending[hostname] === undefined ){ 
				this.pending[hostname] = [cb];
			}else{
				this.pending[hostname].push(cb);
				return; 
			}
			var svr_options = {}
			
			this.certStore.loadCert(hostname, (err, ctx)=>{
				logger.info("PerHostnamesSlaveMaster::getPortForHost cert: ", ctx)
				var server = https.createServer(ctx, this.forwardRequest.bind(this))
					
				// 	(req, resp)=>{
				// 	this.log("HttpsSlave server got a request")
				// 	resp.writeHead(200)
				// 	resp.end("OK got here")
				// 	// forward(req, resp)
				// })
				server.listen(0, "localhost", ()=>{
					logger.info("PerHostnamesSlaveMaster::getPortForHost server listen port : ", server.address().port)
					server.port = server.address().port
					this.servers[hostname] = server;
					var callbacks = this.pending[hostname]
					this.pending[hostname] = undefined;				
					logger.info("PerHostnamesSlaveMaster::getPortForHost drain callbacks", callbacks.length)
					for(cb of callbacks){
						cb(null, server.port)
					}
				})
			})
		}else{
			port = this.servers[hostname].address().port;
			logger.log("PerHostnamesSlaveMaster::getPortForHost Reusing server for hostname: %s port: %d", hostname, port)
			cb(null, port)
		}
	}
	close(){
		for(p in this.servers ){
			p.close()
		}
		
	}
}
/**
* A factor method that creates the appropriate type of HttpsSlaveMaster
* @method _createHttpsSlaveMaster
* @static
* @param {Options object} 
* @param {function} handler - a function that will handle req/resp pairs for sending upstream
*/
function _createHttpsSlaveMaster(options, handler){
	let slave;
	if(options.sni === undefined || options.sni === false )
		slave = new PerHostnameSlaveMaster(options, handler);
	else
		slave = new SniSlaveMaster(options, handler);
	return slave;
}



class WsSlaveMaster
{
	constructor(options){
		
	}
}
class WssSlaveMaster
{
	constructor(options){
		
	}
	
}
// module.exports = HttpsSlaveMaster
/**
* Factory 
*/
module.exports = {
	create : _createHttpsSlaveMaster,
}