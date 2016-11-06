const electron = require('electron')
const {ipCMain, app, BrowserWindow, ipcMain, Menu, systemPreferences} = electron;

// const Menu = require('electron').Menu

const mainMenu 		= require("./menus/main-menu") 
const Backend 		= require("./src/backend")
const Options 		= require("./test/helpers/config")
const TestServers  	= require("./test/helpers/test-servers")
let logger 			= { log : console.log }


let mainWindow;
const 	serverPort = 9443
const	serverHost = "localhost"
const 	proxyPort = 4001
const	proxyHost = "localhost"
let remote;

function send(channel, message){
	mainWindow.webContents.send(channel, message)
}
const argv = process.argv
logger.log(argv)
if( argv.length >= 3)
	logger.log("a config file has been provided it is : ", argv[2])

app.setName("Marvin")

app.on('window-all-closed', () => {
	if (process.platform != 'darwin')
		app.quit();
});

app.on('ready', () => {
	const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize
	mainWindow = new BrowserWindow({
		width: width, 
		height: height,
		title : "Marvin"
	})

	mainWindow.loadURL('file://' + __dirname + '/index.html');
	mainWindow.openDevTools();
    let template = mainMenu(app, mainWindow)
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));

	mainWindow.on('closed', function() {
	    // Dereference the window object, usually you would store windows
	    // in an array if your app supports multi windows, this is the time
	    // when you should delete the corresponding element.
	    mainWindow = null;
	});	
	Backend.start(Options, proxyHost, proxyPort, send, ()=>{
		logger.log("Proxy started")
		// Since we are in test mode lets also start some https servers
		remote = TestServers.createHttps()
		remote.listen(serverPort, serverHost, function(){
			logger.log("test server started serverPort : %s serverHost : %s", serverPort, serverHost)
			
		})
	})

});