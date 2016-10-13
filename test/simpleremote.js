var fs = require('fs');
var http = require("http")
var https = require('https');
var express = require('express');

var handler = function(req, resp){
	console.log(req.method, req.path)
}

function SimpleRemote(){
	console.log("Create a simpleRemote")	
	this.server = http.createServer(handler)
}
SimpleRemote.prototype.listen = function(port, xx, cb){
	console.log("simpleRemote listen", port)
	this.server.listen(port, "localhost", cb)
}
SimpleRemote.prototype.close = function(){
	this.server.close()
}

module.exports = SimpleRemote;

/*

curl -d "foo=baz" -k -x https://localhost:8081 https://localhost:3001/test?fo=bar
curl -d "foo=baz" -k https://localhost:3001/test?fo=bar

*/
