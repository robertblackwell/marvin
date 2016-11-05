const Backbone = require('backbone')
const util = require('util')
const EventEmitter = require('events').EventEmitter

let ReportModel = function(rawReport){
		console.log("ReoprtModel::constructor:: ", rawReport)
		this.protocol 	= rawReport.protocol
		this.hostname 	= rawReport.request.headers['host']
		
		if( this.protocol == "http:")
			this.port = (rawReport.request.headers['port'] === undefined) ? 80 : rawReport.request.headers['port'] 
		if( this.protocol == "https:")
			this.port = (rawReport.request.headers['port'] === undefined) ? 443 : rawReport.request.headers['port'] 
		
		this.request	= rawReport.request
		this.response	= rawReport.response
		EventEmitter.call(this)	
}

ReportModel.prototype.__proto__ =  EventEmitter.prototype;



module.exports = ReportModel