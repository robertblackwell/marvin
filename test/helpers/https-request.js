const request 		= require('request')
const Options		= require("./helpers/config")
const CertStore 	= require("../src/cert-store")
let verbose = true
const tlog = Helpers.testLogger(verbose).log
const Logger = require("../src/logger")
if(!verbose){Logger.enable()}else{Logger.disable()}


module.exports = function HttpsRequest(hostname, serverPort, proxyPort, path, caCert){
	this.requestCounter = 100;
	this.scheme = "https:"
	this.hostname = hostname;
	this.serverPort = serverPort;
	this.proxyPort = proxyPort;
	this.path = path;
	this.caCert = caCert;
	this.targetUrl = this.scheme+"//"+this.hostname+":"+this.serverPort+this.path
	this.proxyUrl = "http:"+"//"+this.hostname+":"+this.proxyPort+this.path
	
	this.getOptions = function(){
		let opts = {
			method: "GET",
			url : this.targetUrl,
			proxy: this.proxyUrl,
			rejectUnauthorized : false,
			ca : caCert,
			headers:{
				"marvin-scheme":"https:",
				"marvin-host":this.hostname,
				"marvin-port":this.serverPort,
				"marvin-uid": ""
			}
		}
		return opts;
	}
	
	this.run = function(done){
		this.counter++;
		let uid = this.hostname+":"+this.serverPort+":"+this.proxyPort+":"+this.path+":"+this.counter
		let opts = this.getOptions();
		opts.headers["marvin-uid"] = uid;
		
		request(opts, (err, res, body)=>{
			tlog("HttpsRequestObject::doRequest::uid[ %s ] got a response", uid, err, res.statusCode, body);
			assert.equal(res.statusCode, 200) // successful request
			let bodyObj = JSON.parse(body)
			assert.notEqual(bodyObj,null)
			assert.equal(bodyObj.method, "GET")
			assert.equal(bodyObj.headers.host, this.hostname+":"+this.serverPort)
			let h = bodyObj.headers
			assert.equal(h['marvin-scheme'],"https:")
			assert.equal(h['marvin-host'],this.hostname)
			assert.equal(h['marvin-port'],this.serverPort)
			assert.equal(h['marvin-uid'],uid)
			done();
		})
	}
	
}

