const ReportSummaryView = require("./report-summary-view")
const $ = require('jquery')

// let MainView = Backbone.View.extend({
// 	tagName : "div",
// 	subViews : [],

// 	initialize : function(){
// 		this.listenTo(this.model, 'add', this.addOne)
// 		this.listenTo(this.model, 'change', ()=>{})
// 	},
// 	addOne:(m)=>{
// 		let sView = new ReportSummaryView(m, this.el)
// 		subViews.push(sView)
// 		sView.render()
// 	},
// 	render: ()=>{

// 	}

// })

class MainView{
	constructor(collection){
		this.collection = collection;
		this.$el = $('body');
		this.el = this.$el[0];
		this.subViews = [];
		this.collection.on('add', (report)=>{
			let sv = new ReportSummaryView(report, this.el)
			sv.render()
		})
	}
	render(){

	}
}
module.exports = MainView
