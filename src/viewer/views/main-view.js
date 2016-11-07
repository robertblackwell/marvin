const ReportSummaryView = require("./report-summary-view")
const $ = require('jquery')

const buttonTmpl = `
	<div class="button-bar">
		<button type="button"> Clear </button>
	</div>
`

class MainView{
	constructor(collection){
		this.collection = collection;
		let $buttons = $("");//$(buttonTmpl)
		this.$el = $('#main-content')

		$('#main-content').append("<div id='log-area' class='log-area'></div>")
		this._$el = $("#main-content").find("#log-area")
		this._el = this._$el[0];
		this.subViews = [];
		this.collection.on('add', (report)=>{
			let sv = new ReportSummaryView(report, this._el)
			sv.render()
		})
		this.collection.on('empty', this.empty.bind(this))
		$buttons.click(()=>{
			console.log("button click - empty display")
			this.collection.clear()
		})
	}
	empty(){
		this._$el.empty()		
	}
	render(){
		this._$el.empty()
		return;
	}
}
module.exports = MainView
