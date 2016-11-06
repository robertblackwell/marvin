const Backbone = require('backbone')
const $ = require('jquery')
const _ = require('underscore')

const tmpl = `
	<div class="report">
		<div class='report-header'>
			<!--h3><%= protocol %>://<%= hostname %> : <%= port %></h3-->
			<span style='white-space:pre-wrap;word-wrap:break-word'><%= url %></span>
		</div>
		<div class='report-request'>
			<!--h3>Request</h3-->
		</div>
		<div class='report-response'>
			<!--h3>Response</h3-->
		</div>
	</div>
`
const tempFun = _.template(tmpl)


/**
* Renders a single http transaction report and adds click handlers for expansion/contraction of
* the individual report block
* @class ReportView
*/
module.exports = class ReportSummaryView{
	/**
	* @constructor
	* @param {ReportModel} reportModel - the model for which the block is to be rendered
	* @param {html element} el - append this report to the end of the element 
	*/
	constructor(reportModel, el){
		this.model = reportModel
		this.el = el
		this.$el = $(el)
	}
	render(){
		let url = this.model.request.url
		if( this.model.protocol === "https:" ){
			url = this.model.protocol+"://"+this.model.hostname + ":" + this.model.port + this.model.request.url
		}

		let html = tempFun({
			protocol : this.model.protocol,
			hostname : this.model.hostname,
			port : this.model.port,
			url : url,
		})
		let newEl = $(html)
		this.$myEl = newEl
		this.$el.append(newEl)
		this.$myEl.find(".report-request").hide()
		this.$myEl.find(".report-response").hide()

		this.$myEl.find(".report-request").append(renderRequest(this.model.request))
		this.$myEl.find(".report-response").append(renderResponse(this.model.response))

		this.visible = false;
		this.$myEl.click(function(){
			console.log("ReportSummaryView::clickhandler")
			if( this.visible ){
				this.visible = false;
				this.$myEl.find(".report-request").hide()
				this.$myEl.find(".report-response").hide()
			}else{
				this.visible = true;
				this.$myEl.find(".report-request").show()
				this.$myEl.find(".report-response").show()
			}
		}.bind(this))
	}
}

function renderRequest(req, $el){

	let reqLineTmpl = "<span style='white-space:pre-wrap;word-wrap:break-word'> HTTP/<%= vers %> <%= method %> <%= url %> </span>"
	let lf = _.template(reqLineTmpl)

	let fObj = {vers : req.httpVersion, method : req.method, url : req.url}
	let flhtml = lf(fObj)	
	let $myel = $("<div class='request'></div>")
	$myel.append(flhtml)
	$myel.append(renderHeaders(req.headers))
	$myel.append(renderBody(req.rawBody))
	return $myel

}
function renderResponse(resp, $el){
	let tmpl = `
		<div class='response first-line'>
			<div class='response-headers'>
			</div>
			<div class = 'response-body'>
			</div>
		</div>
	`
	let firstLineTempl = "<span  style='white-space:pre-wrap;word-wrap:break-word'> <%= statusCode %> <%= statusMessage %> HTTP/<%= vers %></span>"
	let lf = _.template(firstLineTempl)

	let fObj = {vers : resp.httpVersion, statusCode : resp.statusCode, statusMessage : resp.statusMessage}
	let flhtml = lf(fObj)	
	let $myel = $("<div class='response'></div>")
	$myel.append(flhtml)
	$myel.append(renderHeaders(resp.headers))
	$myel.append(renderBody(resp.rawBody))
	console.log("ReportSummaryView::renderResponse::rawBody::", typeof resp.rawBody, 
		resp.headers['content-encoding'],
		resp.rawBody.toString())
	return $myel
}

function renderBody(body){
	let $myel = $("<div class='html-body'><h4>Body</h4><div>")
	let tml= "<code><pre><%- body %></pre></code>"
	let tf = _.template(tml)
	let h = tf({body: body})
	$myel.append( $(h))
	$myel.append("</div></div>")	
	return $myel
}

function renderHeaders(headers){

	let $myel = $("<div class='html-headers'><h4>Headers</h4><div>")
	for( h in headers){
		let label = h;
		let value = headers[h]
		let obj = {label: h, value : value}
		let tmpl = `<span  style='white-space:pre-wrap;word-wrap:break-word'><%= label %> : <%= value %></span><br> `
		let tf = _.template(tmpl)
		let $newEl = $(tf(obj))
		$myel.append($newEl)
	}
	$myel.append("</div></div>")
	return $myel
}


