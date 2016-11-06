const Mitm 				= require("./mitm-server")
const Logger 			= require("./logger")
const MitmReportType 	= require("./mitm-report-type")
const MitmReport 		= require("./mitm-report")
const Channel			= require('./channels')

Logger.enable()

let mitm;

module.exports = {
	testStart : function(send){
		console.log(send)
		var counter = 1;
		var interval = setInterval(()=>{
			console.log("interval fired")
			  send('channel', 'pong ' + counter++);
			  if( counter == 100 )
			  	clearInterval(interval)
		  },500)
		
	},
	start: function(Options, proxyHost, proxyPort, sendFunction, cb){
		mitm = new Mitm(Options)
		mitm.listen(proxyPort, proxyHost, function(){
			cb(null, mitm)
		})
		mitm.on("finish", (tx)=>{
			if( tx.type === MitmReportType.HTTPS_TUNNEL ){
				console.log("Backend::tunnel")
				sendFunction(Channel.HTTPS_TUNNEL, tx)
				
			}else if( tx.type === MitmReportType.HTTP_TRANSACTION ){
				console.log("Backend::tx")
				sendFunction(Channel.HTTP_TX, tx)
			}
			
		})
		
	}
}