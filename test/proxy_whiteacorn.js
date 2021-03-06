var request = require('request')
var Mitm 	= require("mitm-server")
var assert 	= require("assert")
var inspect = require("util").inspect
var http 	= require("http")
var Options = require("test/helpers/config")

const Logger = require("logger")
const Helpers = require("test/helpers/functions")
Logger.disable()
let verbose = false
let tlog = Helpers.testLogger(verbose)

const proxiedHost = "whiteacorn";
const proxyPort = 4001

describe("a few simple tests with local whiteacorn", function(done){

	var mitm;
	
	before(function(done){
		mitm = new Mitm(Options)
		mitm.listen(4001, "127.0.0.1")
		done()
	})
	
	after(function(done){
		mitm.close(()=>{
			done()			
		})
	})
	
	it("raw http.request to whiteacorn/ctl/", function(done){
		let chunk_arr = [];
		let responseBody = null;
		let rb = "";
		let r = http.request(
			"http://whiteacorn/ctl/",
			function(res){
				assert.equal(res.statusCode, 200)
				res.on('data', function(chunk){
					chunk_arr.push(chunk)
				})
				res.on('end', function(){
					responseBody = Buffer.concat(chunk_arr)
					rb = responseBody.toString()
					assert.equal(rb.includes("Whiteacorn - Admin"), true)
					done()
				})
		})
		r.on('error', (e) => {
		  console.log(`problem with request: ${e.message}`);
		  throw e;
		  done()
		});
		r.end()

	})
	
	it("simple proxy request - get whiteacorn/ctl/ via proxy", function(done){
		request({
		    // tunnel: true,
		    url: 'http://whiteacorn/ctl/',
		    proxy: 'http://localhost:' + 4001,
		  },function( err, res, body)
			{
				if (err) {
					console.log("simple proxy - got error", err)
					throw err;
					done();
				}
				assert.equal(res.statusCode, 200) // successful request
				assert.equal(body.includes("Whiteacorn - Admin"), true) // got the correct page
				// assert.notEqual( typeof res.headers["mitm"], "undefined") //the Mitm-proxy actually ptocessed it
				done()
			}
		);
	})
})