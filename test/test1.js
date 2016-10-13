var assert = require('assert');

var CertStore = require('../src/certstore')


describe('getCert', function() {


	before(function(done) {
		done()
	});

	after(function() {
	});

	it('get CERT for whiteacorn', function(done) {
		var cdir = __dirname+"/testdata"
		var caCert = cdir + "/cacert.pem"
		var caKey = cdir + "/cakey.pem"
		var cs = new CertStore({
			certDir 	: cdir,
			caCertPath  : caCert,
			caKeyPath   : caKey
		}, console.log)
		cs.getCert("whiteacorn", function(err, c){
			console.log("call back",err, c)
			assert.equal(err, null)
			assert.notEqual(c, null)
			console.log(c.key)
			console.log(c.cert)
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
			caKeyPath   : caKey
		}, console.log)
		cs.getSecureContext("whiteacorn", function(err, ctx){
			console.log("secureContext call back",err, ctx)
			assert.equal(err, null)
			assert.notEqual(ctx, null)
			console.log(ctx)
			done()
		})
		//done()
	});

});

