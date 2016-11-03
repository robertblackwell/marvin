const assert = require('assert');

const CertStore = require('../src/cert-store')
const Logger = require('../src/logger')
const LogLevels = Logger.LogLevels
Logger.disable()
const logger = require("../src/logger").createLogger(LogLevels.DEBUG)

describe('getCert', function() {


	before(function(done) {
		done()
	});

	after(function() {
	});

	it('get CERT for localhost', function(done) {
		var cdir = __dirname+"/certificate-store"
		var caCert = cdir + "/cacert.pem"
		var caKey = cdir + "/cakey.pem"
		var cs = new CertStore({
			certDir 	: cdir,
			caCertPath  : caCert,
			caKeyPath   : caKey,
			log 		: function FRED(){}, 
		})
		cs.getCert("localhost", function(err, c){
			logger.log("call back",err, typeof c)
			assert.equal(err, null)
			assert.notEqual(c, null)
			assert.notEqual(c.key === undefined, true)
			assert.notEqual(c.cert === undefined, true)
			assert.notEqual(c.ca === undefined, true)
			// log(c.key)
			// log(c.cert)
			done()
		})
		//done()
	});
	it('get secureContext for whiteacorn', function(done) {
		var cdir = __dirname+"/certificate-store"
		var caCert = cdir + "/cacert.pem"
		var caKey = cdir + "/cakey.pem"
		var cs = new CertStore({
			certDir 	: cdir,
			caCertPath  : caCert,
			caKeyPath   : caKey,
			log 		: function FRED(){}
		})
		cs.getSecureContext("whiteacorn", function(err, ctx){
			logger.log("secureContext call back",err, typeof ctx)
			assert.equal(err, null)
			assert.notEqual(ctx, null)
			assert.equal(ctx.constructor.name, "SecureContext")
			assert.equal(ctx.context === undefined, false)
			// log(require('util').inspect(ctx))
			done()
		})
		//done()
	});

});

