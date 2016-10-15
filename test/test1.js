var assert = require('assert');

var CertStore = require('../src/certstore')
var log = console.log;

describe('getCert', function() {


	before(function(done) {
		done()
	});

	after(function() {
	});

	it('get CERT for localhost', function(done) {
		var cdir = __dirname+"/testdata"
		var caCert = cdir + "/cacert.pem"
		var caKey = cdir + "/cakey.pem"
		var cs = new CertStore({
			certDir 	: cdir,
			caCertPath  : caCert,
			caKeyPath   : caKey,
			log 		: function FRED(){}, 
		})
		cs.getCert("localhost", function(err, c){
			log("call back",err, c)
			assert.equal(err, null)
			assert.notEqual(c, null)
			log(c.key)
			log(c.cert)
			done()
		})
		//done()
	});
	it('get secureContext for whiteacorn', function(done) {
		var cdir = __dirname+"/testdata"
		var caCert = cdir + "/cacert.pem"
		var caKey = cdir + "/cakey.pem"
		var cs = new CertStore({
			certDir 	: cdir,
			caCertPath  : caCert,
			caKeyPath   : caKey,
			log 		: function FRED(){}  
		})
		cs.getSecureContext("whiteacorn", function(err, ctx){
			log("secureContext call back",err, ctx)
			assert.equal(err, null)
			assert.notEqual(ctx, null)
			log(ctx)
			done()
		})
		//done()
	});

});

