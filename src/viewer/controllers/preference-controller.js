const electron = require('electron')
const {BrowserWindow} = electron
let win = null;

module.exports = function(){
	return {
		show: function(){
			if( win !== null ){
				console.log("window is alreadu open")
				return;
			}
			console.log("preferences-controller");
				const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
				win = new BrowserWindow({
					width: width, 
					height: height,
					title : "Marvin Preferences"
				})
				win.loadURL('file://' + __dirname + '/../../../html/preferences.html');
				win.openDevTools();
				win.on('closed', ()=>{
					win = null;
				})

		}
	}
}