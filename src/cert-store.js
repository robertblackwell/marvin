var exec 	= require('child_process').exec
var mkdirp 	= require('mkdirp')
var path 	= require('path')
var fs 		= require('fs')
var tls 	= require('tls')
var _ 		= require("underscore")

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
function testFileExists(filePath){
	try{
		var s = fs.statSync(filePath)
		return true;
	}catch(e){
		return false;
	}
}
module.exports = class CertStore {
	
	constructor(options) {	
		this.options = {}
		_.defaults(this.options, options, {
			log: function nolog(){}
		})
		// console.log(options)
		this.dir = options.certDir
		if( ! testFileExists(this.options.certDir) ) throw Error("certDir " + this.options.certDir + " does not exist")
		this.caCert = options.caCertPath
		if( ! testFileExists(this.options.caCertPath) ) throw Error("caCertPath " + this.options.caCertPath + " does not exist")
		this.caKey = options.caKeyPath
		if( ! testFileExists(this.options.caKeyPath) ) throw Error("caKeyPath " + this.options.caKeyPath + " does not exist")
		this.cache = {}
		this.queued = {}
		mkdirp.sync(options.certDir)
		this.log = this.options.log
	}
	getCACert(){
		const certificatePath = this.caPath();
		const ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});	
		return ca;
	}
	getCert( hostname, cb) {
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
	getSecureContext( hostname, cb){
		this.getCert(hostname, (err, data) => {
			var ctx = tls.createSecureContext(data)
			this.log("createSecureContext", ctx)
			cb(null, ctx)
		})	
	}
	caPath(){
		return path.resolve(this.dir, "cacert.pem")
	}
	hostKeyPath(hostname){
		return path.resolve(this.hostDir(hostname), "key.pem")		
	}
	hostCsrPath(hostname){
		return path.resolve(this.hostDir(hostname), hostname + ".csr")
	}
	hostCertPath(hostname){
		return path.resolve(this.hostDir(hostname), "cert.pem")
	}
	hostDir(hostname){
		// return this.dir;
		return path.resolve(this.dir, hostname)
	}
	loadCert( hostname, cb) {
		var store = this;
		var keyPath = this.hostKeyPath(hostname)
		var certPath = this.hostCertPath(hostname)
		var caPath = this.caPath()

		this.log("keyPath: ", keyPath)
		this.log("certPath: ", certPath)

		var cache = this.cache

		if (testFileExists(certPath) && testFileExists(keyPath)) {
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
						if (err) return cb(err, null)
						cache[hostname] = 	{key: key, cert: cert, ca: cacert}
						cb(null, cache[hostname])
					})
				})
			})
		}
	}

	makeCert( hostname, done) {
		this.log('info', 'creating certs for ' + hostname)
		var keyPath = this.hostKeyPath(hostname)
		var certPath = this.hostCertPath(hostname)
		var caPath = this.caPath()
		var csrPath = this.hostCsrPath(hostname)
		mkdirp.sync(this.hostDir(hostname))
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
}