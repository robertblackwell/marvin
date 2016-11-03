var url = require('url')
var request = require('request')
var Mitm 	= require("../src/mitm-server")
var assert 	= require("assert")
var util	= require("util")
var fs = require('fs')
var inspect = require("util").inspect
var http 	= require("http")
var https 	= require("https")
var _ = require("underscore")

var TestServers = require("../test/helpers/test-servers")
var Options	= require("./helpers/config")

var createServer = TestServers.createHttps

function definePaths(dispatcher)
{
	// Test GET with query string
	dispatcher.onGet("/test", function(req, resp){
		// console.log("GET path /test")
		var bObj = {
			protocol: req.protocol,
			url 	: req.url,
			method	: req.method,
			query	: url.parse(req.url, true).query,
			body	: req.body,
			headers	: req.headers
	    }
		resp.writeHead(200, {'Content-type' : 'text/plain'})
		resp.write(JSON.stringify(bObj))
		resp.end()		
	})
	// Test POST with body
	dispatcher.onPost("/test", function(req, resp){
		// console.log("PUT path /test")
		var bObj = {
		      protocol: req.protocol,
		      method:   req.method,
		      body:     req.body,
		      headers:  req.headers
	    }
		resp.writeHead(200, {'Content-type' : 'text/plain'})
		resp.write(JSON.stringify(bObj))
		resp.end()
	})		
}
const serverOptions = {
  key: fs.readFileSync(__dirname + '/helpers/certs/server-key.pem'),
  cert: fs.readFileSync(__dirname + '/helpers/certs/server-cert.pem')
};

//
// Prove the test server works
//
describe("https direct to TestServer - no mitm", function(done){
	var mitm;
	var remote;

	before(function(done){
		remote = TestServers.createHttps(serverOptions, definePaths)
		remote.listen(4001, "localhost", function(){
				done()
		})
	})
	after(function(done){
		remote.close(function(){
				done()			
		})
	})

	it("https.request", function(done){
		var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		
		const opts = {
			method: "GET",
			hostname : "localhost",
			port : 4001,
			path : "/test?var1=value1",
			ca : ca,
		}
		let r = https.request(opts, function(res){
			// console.log("response", res.statusCode)
			//
			// IN here perform assert operations for any test
			//
			assert.equal(res.statusCode, 200)
			// console.log(res.statusCode)
			let data = "";
			res.on('data', (chk)=>{
				data += chk.toString() 
				// console.log(data)
			})
			res.on('end',()=>{
				body = data;				
				var obj = JSON.parse(body.toString())
				assert.equal(obj.query.var1, "value1")
				done()
			})
		}).end()
	})
	it("using request", function(done){
		var certificatePath = __dirname + "/helpers/certs/ca-cert.pem";
		var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});
		
		const opts = {
			method: "GET",
			// hostname : "localhost",
			// port : 4001,
			// path : "/test?var1=value1",
			url : "https://localhost:4001/test?var1=value1",
			ca : ca,
		}
		let r = request(opts, function(err, res, body){
			//
			// IN here perform assert operations for any test
			//
			assert.equal(res.statusCode, 200)
			var obj = JSON.parse(body.toString())
			assert.equal(obj.query.var1, "value1")
			done()
		}).end()
	})
})
