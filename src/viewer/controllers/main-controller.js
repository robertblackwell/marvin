const ReportCollection = require("../models/report-collection")
const MainView = require("../views/main-view")
const ReportModel = require("../models/report-model")

module.exports = class MainController{
	constructor(){
		this.reportCollection = new ReportCollection()
		this.mainView = new MainView(this.reportCollection)
	}
	addReport(report){
		this.reportCollection.push(report)
	}
	receiveTXReportIpc(rawReport){
		console.log("MainController::receiveTXReportIpc", rawReport);
		let reportModel = new ReportModel(rawReport)
		console.log("MainController::receiveTXReportIpc::reportModel", reportModel);
		this.addReport(reportModel)
	}
	receiveTunnelReportIpc(rawReport){
		console.log("MainController::receiveTunnelReportIpc", rawReport);
		return
		let reportModel = new ReportModel(rawReport)
		this.addReport(reportModel)
	}
}