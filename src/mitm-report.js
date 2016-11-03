const MitmReportType = require("./mitm-report-type")
const Logger = require("./logger")
const LogLevels = require("./logger").LogLevels
const logger = require("./logger").createLogger(LogLevels.DEBUG)

module.exports = {
	/**
	* Creates an object that reports a https tunnel
	* @param status - string
	* @param host - string
	* @param port - number
	* @returns - a report object literal
	*/
	createHttpsTunnelReport : function(status, host, port){
		return {
			type : MitmReportType.HTTPS_TUNNEL,
			host : host,
			port : port
		}
	},
	/**
	* Creates an object that reports a http or proxied https request/response cycle where the request
	* and response have been captured (not tunneled)
	* @param protocol - string http: or https:
	* @param req 	- IncomingMessage
	* @param resp 	- IncomingMessage
	* @returns - a report object literal
	*/
	createHttpTransactionReport : function(protocol, req, resp){
		return {
			type : MitmReportType.HTTP_TRANSACTION,
			protocol : protocol,
			request  : stripRequest(req),
			response : stripResponse(resp)
		}
	}
	
} 
/**
* Strips out properties of interest from an IncomingMessage that re[resents a http(s) request
* @param {IncomingMessage} req
* @returns {Object} literal 
*/
function stripRequest(req){
	// console.log("stripRequest: ", req.httpVersion)
	// console.log("stripRequest: ", req.method)
	// console.log("stripRequest: ", req.url)
	// console.log("stripRequest: ", req.headers)
	// console.log("stripRequest: ", req.rawBody)
	// console.log("stripRequest: ", req.trailers)
	let r = {
		httpVersion: req.httpVersion,
		method : req.method,
		url	: req.url,
		headers: req.headers,
		rawBody : req.rawBody,
		trailers : req.trailers
	}
	// console.log("stripRequest::", r)
	return r;
}
/**
* Strips out properties of interest from an IncomingMessage that re[resents a http(s) response
* @param {IncomingMessage} resp
* @returns {Object} literal 
*/
function stripResponse(resp){
	// console.log("stripResponse: ", resp)
	let r = {
		httpVersion: resp.httpVersion,
		statusCode : resp.statusCode,
		statusMessage : resp.statusMessage,
		headers: resp.headers,
		rawBody : resp.rawBody,
		trailers : resp.trailers
	}
	// console.log("stripResponse::", r)
	return r;
}
