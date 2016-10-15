var exec = require('child_process').exec
var mkdirp = require('mkdirp')
var path = require('path')
var fs = require('fs')
var tls = require('tls')
var _ = require("underscore")


module.exports = CertStore

/**
*	Arguments
*		options : An options object with the following properties
*			type: 	currently unused
*			dir : 	full path to an existing directory where a CertStore 
*					object will place two files 
*						<hostname>-key.pem and 
*						<hostname>-cert.pem files
*					for each host/server it supports
*
*			log :      
*/
function CertStore (options) {
	
	if (!(this instanceof CertStore)) return new CertStore(options);
	this.options = {}
	_.defaults(this.options, options, {
		log: function nolog(){}
	})
	this.dir = options.certDir
	this.caCert = options.caCertPath
	this.caKey = options.caKeyPath
	this.cache = {}
	this.queued = {}
	mkdirp.sync(options.certDir)
	this.log = this.options.log
}

CertStore.prototype.getCert = function getCert (hostname, cb) {
	var store = this
	store.log('debug', 'loading cert for ' + hostname)
	if( store.cache[hostname]) {
		store.log('debug', 'loading cert from cache for ' + hostname)
		return process.nextTick(function () {
			cb(null, store.cache[hostname])
		})
	}
	if (store.queued[hostname]) return store.queued[hostname].push(cb)
	store.queued[hostname] = [cb]
	store.loadCert(hostname, drainQueue)

	function drainQueue (err, data) {
		store.log('debug', 'running callbacks waiting for cert creating for ' + hostname)
		var callbacks = store.queued[hostname]
		store.queued[hostname]

		for (var i = 0, len = callbacks.length; i < len; ++i) {
		  callbacks[i](err, data)
		}
	}
}


CertStore.prototype.getSecureContext = function(hostname, cb){
	this.getCert(hostname, (err, data) => {
		var ctx = tls.createSecureContext(data)
		this.log("createSecureContext", ctx)
		cb(null, ctx)
	})	
}

CertStore.prototype.loadCert = function loadCert (hostname, cb) {
	var store = this
	var keyPath = path.resolve(this.dir, hostname + '-key.pem')
	var certPath = path.resolve(this.dir, hostname + '-cert.pem')
	var caPath = path.resolve(this.dir, "cacert.pem")

	this.log("keyPath: ", keyPath)
	this.log("certPath: ", certPath)

	var cache = this.cache

	if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
	return readCert()
	}

	this.makeCert(hostname, readCert)

	function readCert (err) {
		store.log('debug', 'reading cert from fs for ' + hostname)
		if (err) return cb(err)
		fs.readFile(keyPath, (err, key)=> {
			if (err) return cb(err)
			fs.readFile(certPath, (err, cert)=> {
				if (err) return cb(err, null)
				fs.readFile(caPath, (err, cacert)=>{
					cache[hostname] = 	{key: key, cert: cert, ca: cacert}
					cb(null, cache[hostname])
				})
			})
		})
	}
}

CertStore.prototype.makeCert = function makeCert (hostname, done) {
	this.log('info', 'creating certs for ' + hostname)
	var keyPath = path.resolve(this.dir, hostname + '-key.pem')
	var csrPath = path.resolve(this.dir, hostname + '.csr')
	var certPath = path.resolve(this.dir, hostname + '-cert.pem')
	var keyCmd = 'openssl genrsa -out ' + keyPath + ' 1024'
	var csrCmd = 'openssl req -new -key ' + keyPath + ' -out ' + csrPath +
		'  -nodes -subj "/C=US/ST=OR/L=PDX/O=NR/CN=' + hostname + '"'
	var certCmd = 'openssl x509 -req -days 3650 -CA ' + this.caCert + ' -CAkey ' +
		this.caKey + ' -in ' + csrPath + ' -out ' + certPath + ' -set_serial ' + Math.floor(Number.MAX_SAFE_INTEGER * Math.random())

	var commands = [keyCmd, csrCmd, certCmd]

	next(0)

	function next (n) {
		exec(commands[n++], function (err) {
		if (err) return done(err)
		n < commands.length ? next(n) : done(null)
		})
	}
}
