var request = require('request')
var Mitm 	= require("../src/MitmServer")
var assert 	= require("assert")
var inspect = require("util").inspect
var http 	= require("http")
// var Remote = require("./simpleremote")
var dispatcher = require('httpdispatcher')

var done = function(){}

dispatcher.onPost("/test", function(req, resp){
	console.log("/test handler called", req.body)
	var bObj = {
	      protocol: req.protocol,
	      method:   req.method,
	      query:    req.query,
	      body:     req.body,
	      headers:  req.headers
    }
	resp.writeHead(200)
	resp.write(JSON.stringify(bObj))
	resp.end()
})

var handler = function(req, resp)
{
	console.log("handler called")
	dispatcher.dispatch(req, resp)
}


	var mitm;
	var remote;

		remote = http.createServer(function(req, resp){
			dispatcher.dispatch(req, resp)
		})
		remote.listen(9990, "127.0.0.1", function(){
			console.log("remote-listen callback")
			mitm = new Mitm({})
			mitm.listen(4001, "127.0.0.1")
			done()
		})
	
	
	
		console.log("doing a post")
		var formData = {
			var1: "value1",
			var2: "value2"
		}
		request({
			method: "POST",
		    url: 'http://127.0.0.1:9990/test',
			body: "This is a request body"
		  }
		  ,function( err, res, body)
			{
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}
				
				assert.equal(res.statusCode, 200) // successful request
				var bodyObj = JSON.parse(body)
				console.log(bodyObj)
				assert.notEqual(bodyObj,null)
				assert.equal(bodyObj.method, "POST")
				assert.equal(bodyObj.headers.host, "127.0.0.1:9990")
				// assert.equal(bodyObj.query.var1, "value1")
				done()
			}
		)
