var fs = require('fs');
var http = require("http")
var https = require('https');
var express = require('express');


function SimpleRemote(){
	console.log("Create a simpleRemote")
	
	var handler = function(req, resp){
		console.log(req.method, req.path)
	}
	this.server = http.createServer(handler)
}
SimpleRemote.prototype.listen = function(port, xx, cb){
	console.log("simpleRemote listen", port, cb)
	this.server.listen(port, cb)
}

function Remote() {

  this.httpsOpts = {
    // key:  fs.readFileSync('./cert/dummy.key', 'utf8'),
    // cert: fs.readFileSync('./cert/dummy.crt', 'utf8')
  };

  this.app = express();
  this.app.use(express.urlencoded());

// ECHO - generate a response that shows us what we got 
  this.app.all('/test', function(req, res) {
    // console.log("server:/test", req)
	req.on('data', function(chunk){
		console.log("server request chunk", chunk.toString())
	})  
    res.json({
      protocol: req.protocol,
      method:   req.method,
      query:    req.query,
      body:     req.body,
      headers:  req.headers
    });
  });

  this.app.all('/response_modify', function(req, res) {
    console.log("server:/reponse-modify")
    res.send('CHANGEME');
  });

  this.app.all('/redirect', function(req, res) {
    console.log("server:/redirect")
    res.redirect(302, '/not-found#fragment');
  });

  this.app.all('/not-found', function(req, res) {
    console.log("server:/not-found")
    res.json(404, {status: 404});
  });
}

Remote.prototype.listen = function(httpPort, httpsPort, cb) {
  var self = this;
  this.httpServer = this.app.listen(httpPort, function(err) {
    if (err)
      return cb(err);
	else
		cb(null)
    // self.httpsServer = https.createServer(self.httpsOpts, self.app).listen(httpsPort, cb);
  });
};


Remote.prototype.close = function(cb) {
  var self = this;
  self.httpServer.close(function(err) {
    if (err)
      return cb(err);
	else
		cb(null)
    // self.httpsServer.close(cb);
  });
};


module.exports = Remote;

/*

curl -d "foo=baz" -k -x https://localhost:8081 https://localhost:3001/test?fo=bar
curl -d "foo=baz" -k https://localhost:3001/test?fo=bar

*/
