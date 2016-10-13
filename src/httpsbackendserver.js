var https = require('https')
var logger = console

/**
* A backend server is a normal https server that listens (is connected to via) a unix socket
* The main proxy server directs traffic from CONNECT requests through an/the instance of
* a backend server.
*
* To serve as a backend for many servernames this server must use SNI callback to get the tls.secureContext
* for any particular hostname/servername. The server makes use of the certstore class
* to manage (and if needed) create the required securecontext.
*
*	options (Object)
*		certStore 		: instance of CertStore
*		listSocketPath 	: fullpath to a unix socket on which this server will listen 
*		
*/
var HttpsBackendServer = module.exports = function HttpsbackendServer(options){
	this.log = logger.log
	this.options = options
	this.listenSocketPath = options.listenSocketPath
	
	if (fs.existsSync(this.listenSocketPath))
	    fs.unlinkSync(this.listenSocketPath);
	
	// We need a certificate store in order to get/create a tls.secureContext for any host
	// so that we can mitm https requests for that host
	this.certStore = options.certStore
	
	//
	// Since this one https server will serve on behalf of multiple host names
	// we dont give it key/cert for any particular servernames, instead give it an SNICallback
	//
	var serverContext = {
		SNICallback : (servername, cb) => {
			var ctx = this.certStore.getSecureContext(servername, function(err, ctx){
				cb(null, ctx)
			})
		}
	}
	
	this.beServer = https.createServer(serverContext)
	this.beServer.on('request', this.handleRequest.bind(this))
}
HttpsBackendServer.prototype.listen = function(listenSocketOrPath){
	this.beServer.listen(this.listenSocketOrPath)	
}
HttpsBackendServer.prototype.handleRequest = function(req, resp){
	this.log("HTTPSBackendServer::handleRequest", req, resp)
}.bind(this)