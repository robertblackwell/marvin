/*
* This test simple fires off a lot of requests using both https.request({}) and request({})
* But only to servers without a mitm in the middle.
* But it does demonstrate how to test parallel requests 
*/
const async = require('async')
const url = require('url')
const request = require('request')
const Mitm 	= require("../src/mitm-server")
const assert 	= require("assert")
const util	= require("util")
const fs = require('fs')
const inspect = require("util").inspect
const http 	= require("http")
const https 	= require("https")
const process = require("process")
const _ = require("underscore")

const TestServers = require("../test/helpers/test-servers")
const CertStore = require("../src/cert-store")
const Options = require("../test/helpers/config")

let verbose = true
const Helpers = require("../test/helpers/functions")
const tlog = Helpers.testLogger(verbose).log
const Logger = require("../src/logger")
if(verbose){Logger.enable()}else{Logger.disable()}


function runRequests(){
	
	let requests = [];
	
	let scheme = "https:"
	let hostname = "www.ssllabs.com"
	let path = "/ssltest"
	let url = scheme+"//"+hostname+path
	
	let certStore = new CertStore(Options)
	const ca = certStore.getCACert();

	let https_opts = {
		protocol : "https:",
		hostname: hostname,
		// port : 443,
		path: path,
		// ca: ca,
		method: 'GET',
		rejectUnauthorized: false,
		// requestCert: true,
	}
	
	const request_opts = {
		method: "GET",
		url : url,
		rejectUnauthorized:false,
		ca : ca,
	}
	console.log("request_1 about to issue a request", https_opts)
	https.request(https_opts, function(res){
		console.log("request_1 got a response", res.headers)
		res.on('data', (chk)=>{
			console.log("request_1 body chunk: ",chk.toString())
		})
		res.on('end',()=>{
			console.log("request_1 end")
		})
	}).end()

}

runRequests()
