var assert = require('assert');
var fs = require('fs')
var request = require('request')
var net = require('net')
var tls = require('tls')
var _ = require("underscore")
var path = require('path')

var CertStore = require('../src/certstore')
var SlaveMaster = require("../src/slave-master")
var Options	= require("./helpers/config")
var mitmOptions = Options.mitm;
var slaveMasterOptions = Options.slaveMaster
var certStoreOptions = Options.certStore
var ca = Options.ca;

//
// var cdir = __dirname+"/testdata"
// var caCert = cdir + "/cacert.pem"
// var caKey = cdir + "/cakey.pem"

var hostname = "localhost";

// var hostname_cert = function(hostname){return  cdir + "/"+hostname+"-cert.pem";}
// var hostname_key  = function(hostname){ return cdir + "/"+hostname+"-key.pem";}

// var certificatePath = __dirname + "/testdata/cacert.pem";
// var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
//
// var cert_store_options = {
//  		certDir 	: cdir,
//  		caCertPath  : caCert,
//  		caKeyPath   : caKey,
// 		log : function noLog(){}
// }
// var smOptions = {
// 	certStore : cert_store_options,
// 	log : function noLog(){}
// }
// var mOptions = {
// 	slaveMaster : smOptions,
// 	log : function noLog(){}
// }
//
// var opt = {
// 	slaveMaster : {
// 		certStore : {
// 	 		certDir 	: cdir,
// 	 		caCertPath  : caCert,
// 	 		caKeyPath   : caKey,
// 			log : function noLog(){}
// 		},
// 		log : function noLog(){}
// 	},
// 	log : function noLog(){}
//
// }

describe('test slavemaster', function() {

	var m;
	beforeEach(function(done) {
		// fs.unlink(hostname_cert(hostname), (err)=>{
		// 	fs.unlink(hostname_key(hostname), (err)=>{
		// 		done()
		// 	})
		// })
		// m = new SlaveMaster(slaveMasterOptions)
		// m = new SlaveMaster({certStore : cert_store_options, log: function noLog(){}})
		// m = new SlaveMaster(opt.slaveMaster)
		m = new SlaveMaster(Options.mitm.slaveMaster)
		done()
			
	});

	afterEach(function(done) {
		m.close()
		done()
	});

	it("create a slave master, testcert/key get made", function(done){
		var signalDone = _.after(2, ()=>{
			done()
		})
		var port1 = m.getPortForHost(hostname, (port)=>{
					signalDone()
		})
		var port2 = m.getPortForHost(hostname, (port)=>{
					signalDone()
		})
	})
	it("getPortForHost and then make request", function(done){
		// var m = new SlaveMaster({cert_store: cert_store_opts})
		var signalDone = _.after(2,()=>{
			done()
		})
		var port = m.getPortForHost(hostname, (port)=>{
			console.log("port for "+ hostname +" : ", port)
			request({
				url : "https://localhost:"+port,
				method: "GET",
				path : "/",
				ca : ca,
			}, function(err, res, body){
				console.log("got a response", err, res.statusCode, body)
				signalDone()
			})
		})
	//
	// })
	// it("getPortForHost and then make request", function(done){
	// 	// var m = new SlaveMaster({cert_store: cert_store_opts})
	// 	var signalDone = _.after(2,()=>{
	// 		done()
	// 	})
		var port = m.getPortForHost(hostname, (port)=>{
			console.log("port for "+ hostname +" : ", port)
			request({
				url : "https://localhost:"+port,
				method: "GET",
				path : "/",
				ca : ca,
			}, function(err, res, body){
				console.log("got a response", err, res.statusCode, body)
				signalDone()
			})
		})

	})
});

