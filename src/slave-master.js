var CertStore 	= require("./cert-store")
var https 		= require('https')
var fs 			= require('fs')
var _ 			= require("underscore")
var process 	= require("process")

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
*/
class HttpsSlaveMaster
{
	static createHttpsSlaveMaster(options, handler){
		let m =  _createHttpsSlaveMaster(options, handler);
		return m;
	}
	constructor(options, handler){
		this.options = {};
		_.defaults(this.options, options, {
			sni: true,
			log: console.log
		})
		this.certStore = new CertStore(options)
		this.log = this.options.log;
		// this.log = console.log;
		this.sni = (this.options.sni !== undefined && this.options.sni === true)
		
		this.servers = {};
		
		this.slave = undefined;
		
		this.pending = (this.sni)? []: {};
		
		this.serverCount = 0;
		this.handler = handler;
		this.log("HttpsSlaveMaster - constructor complete", this)
	}
	forwardRequest(req, resp){
		this.handler(req, resp)
		console.log("HttpsSlave server got a request")
		resp.writeHead(200)
		resp.end("OK got here")						
	}
	// sniGetPortForHost(hostname, cb)	{
	// 	var slave;
	// 	this.log("sniGetPortForHost")
	//
	// 	if( this.slave === undefined ){
	// 		this.pending.push(cb);
	// 		if( this.pending.length != 1 ){
	// 			this.log("getPort already pending ", this.pending.length)
	// 			return;
	// 		}
	//
	// 		var server_options = {
	// 			SNICallback : (servername, cb)=>{
	// 				this.log("SNICallback : ", servername)
	// 				this.certStore.getSecureContext(servername, (err, ctx)=>{
	// 					this.log("snicallback cb",err)
	// 					cb(err, ctx)
	// 				})
	// 			}
	// 		}
	// 		slave = https.createServer(server_options, this.forwardRequest.bind(this));
	// 		// 	(req, resp)=>{
	// 		// 	this.log("HttpsSlave server got a request")
	// 		// 	resp.writeHead(200)
	// 		// 	resp.end("OK got here")
	// 		// })
	// 		slave.listen(0, "localhost",()=>{
	// 			this.log("server listen port : ", slave.address().port)
	// 			slave.port = slave.address().port
	// 			// Now that we have a port hook slave into this. This signals
	// 			// that the slave is established
	// 			this.slave = slave
	// 			var callbacks = this.pending;
	// 			this.pending = [];
	// 			this.log("drain callbacks", callbacks.length)
	// 			for(cb of callbacks ){
	// 				cb(this.slave.port)
	// 			}
	// 		})
	// 	}else{
	// 		this.log("sniGetPort - reusing", this.slave.port)
	// 		cb(this.slave.port)
	// 	}
	// }
	// serverPerHostGetPortForHost(hostname, cb){
	// 	this.log("serverPerHostGetPortForHost")
	// 	var port;
	// 	var serverOptions;
	//
	// 	if( this.servers[hostname] === undefined){
	// 		this.log("Creating server for", hostname)
	// 		if( this.pending[hostname] === undefined ){
	// 			this.pending[hostname] = [cb];
	// 		}else{
	// 			this.pending[hostname].push(cb);
	// 			return;
	// 		}
	// 		this.log("getPortForHost: ", hostname)
	// 		var svr_options = {}
	//
	// 		this.certStore.loadCert(hostname, (err, ctx)=>{
	// 			this.log("cert: ", ctx)
	// 			var server = https.createServer(ctx, this.forwardRequest.bind(this))
	//
	// 			// 	(req, resp)=>{
	// 			// 	this.log("HttpsSlave server got a request")
	// 			// 	resp.writeHead(200)
	// 			// 	resp.end("OK got here")
	// 			// 	// forward(req, resp)
	// 			// })
	// 			server.listen(0, "localhost", ()=>{
	// 				this.log("server listen port : ", server.address().port)
	// 				server.port = server.address().port
	// 				this.servers[hostname] = server;
	// 				var callbacks = this.pending[hostname]
	// 				this.pending[hostname] = undefined;
	// 				this.log("drain callbacks", callbacks.length)
	// 				for(cb of callbacks){
	// 					cb(server.port)
	// 				}
	// 			})
	// 		})
	// 	}else{
	// 		this.log("Reusing server for", hostname)
	// 		port = this.servers[hostname].address().port;
	// 		cb(port)
	// 	}
	// }
	// getPortForHost(hostname, cb){
	// 	if(this.sni)
	// 		this.sniGetPortForHost(hostname, cb);
	// 	else
	// 		this.serverPerHostGetPortForHost(hostname, cb)
	// }
	// close(){
	// 	if(this.options.sni){
	// 		this.slave.close()
	// 	}else{
	// 		for(p in this.servers ){
	// 			p.close()
	// 		}
	// 	}
	// }
}
class SniSlaveMaster extends HttpsSlaveMaster
{
	constructor(options, handler){
		super(options, handler)
	}
	getPortForHost(hostname, cb)	{
		var slave;
		this.log("sniGetPortForHost")
		
		if( this.slave === undefined ){ 
			this.pending.push(cb);
			if( this.pending.length != 1 ){
				this.log("getPort already pending ", this.pending.length)
				return;
			}

			var server_options = {
				SNICallback : (servername, cb)=>{
					this.log("SNICallback : ", servername)
					this.certStore.getSecureContext(servername, (err, ctx)=>{
						this.log("snicallback cb",err)
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
				this.log("server listen port : ", slave.address().port)
				slave.port = slave.address().port
				// Now that we have a port hook slave into this. This signals 
				// that the slave is established
				this.slave = slave
				var callbacks = this.pending;
				this.pending = [];
				this.log("drain callbacks", callbacks.length)
				for(cb of callbacks ){
					cb(this.slave.port)
				}
			})
		}else{
			this.log("sniGetPort - reusing", this.slave.port)
			cb(this.slave.port)
		}
	}	
	close(){
		this.slave.close()		
	}
}
class PerHostnameSlaveMaster extends HttpsSlaveMaster
{
	constructor(options, handler){
		super(options, handler)		
	}
	getPortForHost(hostname, cb){
		this.log("serverPerHostGetPortForHost")
		var port;
		var serverOptions;

		if( this.servers[hostname] === undefined){
			this.log("Creating server for", hostname)
			if( this.pending[hostname] === undefined ){ 
				this.pending[hostname] = [cb];
			}else{
				this.pending[hostname].push(cb);
				return; 
			}
			this.log("getPortForHost: ", hostname)
			var svr_options = {}
			
			this.certStore.loadCert(hostname, (err, ctx)=>{
				this.log("cert: ", ctx)
				var server = https.createServer(ctx, this.forwardRequest.bind(this))
					
				// 	(req, resp)=>{
				// 	this.log("HttpsSlave server got a request")
				// 	resp.writeHead(200)
				// 	resp.end("OK got here")
				// 	// forward(req, resp)
				// })
				server.listen(0, "localhost", ()=>{
					this.log("server listen port : ", server.address().port)
					server.port = server.address().port
					this.servers[hostname] = server;
					var callbacks = this.pending[hostname]
					this.pending[hostname] = undefined;				
					this.log("drain callbacks", callbacks.length)
					for(cb of callbacks){
						cb(server.port)
					}
				})
			})
		}else{
			this.log("Reusing server for", hostname)
			port = this.servers[hostname].address().port;
			cb(port)
		}
	}
	close(){
		for(p in this.servers ){
			p.close()
		}
		
	}
}

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
module.exports = HttpsSlaveMaster