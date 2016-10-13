var url = require('url')
var request = require('request')
var Mitm 	= require("../src/MitmServer")
var assert 	= require("assert")
var util	= require("util")
var fs = require('fs')
var inspect = require("util").inspect
var http 	= require("http")
var https 	= require("https")
var dispatcher = require('httpdispatcher')
var _ = require("underscore")

const options = {
  key: fs.readFileSync(__dirname + '/helpers/certs/server-key.pem'),
  cert: fs.readFileSync(__dirname + '/helpers/certs/server-cert.pem')
};

var server = https.createServer(options, function(req, resp){
	console.log("server got a request")
	resp.writeHead(200)
	resp.write("this is a response")
	resp.end()
	
})

function httpsrequest(){
	console.log("httpsrequest about to issue a request")
	var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
	var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
	// console.log(ca);
	var r = https.request(
		{
		host: 'localhost',
		port: 9991,
		path: '/',
		ca: ca,
		method: 'GET',
		// rejectUnauthorized: false,
		// requestCert: true,
	
	}
	, function(res){
		console.log("got a response")
		res.on('data', function(ck){
			console.log(ck.toString())
		})
		res.on('end', function(){
			server.close();
		})
	})
	r.on("error", function(err){
		console.log(err)
	})
	r.end()	
}

function request_request(){
	console.log("httpsrequest about to issue a request")
	var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
	var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
	request({
		method: "GET",
		url : "https://localhost:9991",
		path : "/",
		ca : ca,
	}, function(err, res, body){
		console.log("got a response", err, res.statusCode, body)
		server.close()
	})
}

server.listen(9991, "localhost", request_request)

