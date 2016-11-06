const ReportModel = require('./report-model')

const util = require('util')
const EventEmitter = require('events').EventEmitter

function ReportCollection(){
	this.elements = []
	EventEmitter.call(this)
}
ReportCollection.prototype.push = function(report){
	this.elements.push(report)
	this.emit('add', report)
}
ReportCollection.prototype.clear = function(){
	this.elements = [];
	this.emit('empty', this)
}

util.inherits(ReportCollection, EventEmitter)

module.exports = ReportCollection