const {app, BrowserWindow} = require('electron');
const {ipcMain} = require('electron')
const Backend = require("./src/backend")
const Options = require("./test/helpers/config")
const TestServers  = require("./test/helpers/test-servers")

let mainWindow;
const 	serverPort = 9443
const	serverHost = "localhost"
const 	proxyPort = 4001
const	proxyHost = "localhost"
let remote;

function send(channel, message){
	mainWindow.webContents.send(channel, message)
}

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		height: 600,
		width: 800
	});
	mainWindow.loadURL('file://' + __dirname + '/index.html');
	mainWindow.openDevTools();
	Backend.start(Options, proxyHost, proxyPort, send, ()=>{
		console.log("Proxy started")
		// Since we are in test mode lets also start some https servers
		remote = TestServers.createHttps()
		remote.listen(serverPort, serverHost, function(){
			console.log("test server started serverPort : %s serverHost : %s", serverPort, serverHost)
			
		})
	})

  });