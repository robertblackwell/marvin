class MitmReportType {
	constructor(id){
		this.id = id;
	}
	toString(){
		return "MitmReportType::"+this.id
	}
}
MitmReportType.HTTP_TRANSACTION = new MitmReportType("HttpTransaction")
MitmReportType.HTTPS_TUNNEL = new MitmReportType("HttpsTunnel")

module.exports = MitmReportType