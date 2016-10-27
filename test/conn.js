var url = require('url')
var request = require('request')
var Mitm 	= require("../src/mitm-server")
var assert 	= require("assert")
var util	= require("util")
var inspect = require("util").inspect
var http 	= require("http")
var fs 		= require("fs")
var assert = require('assert')

var _ = require("underscore")

describe("test connection manager mechanics", function(done){

	
	it("get and release a connection", function(done){
		let m = require("../src/connection-manager");
		m.getConnectionForHostPort("http","ahost",1234, (err, conn)=>{
			conn.marker = "THISISAMARKER";
			m.releaseConnection(conn)
			m.getConnectionForHostPort("http","ahost",1234,(err, c)=>{
				console.log("MARKER", c.marker)
			})
			let t = setTimeout(()=>{
				console.log("test timeout fired")
				done()
			}, 1500)
			
		});
	})

})