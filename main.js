const {app, BrowserWindow} = require('electron');
const {ipcMain} = require('electron')
const Backend = require("./src/backend")
const Options = require("./test/helpers/config")
const TestServers  = require("./test/helpers/test-servers")
let logger = { log : console.log }
const Menu = require('electron').Menu




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

app.on('window-all-closed', () => {
  if (process.platform != 'darwin')
    app.quit();
});

app.on('ready', () => {
	mainWindow = new BrowserWindow({
		height: 800,
		width: 1300
	});

	mainWindow.loadURL('file://' + __dirname + '/index.html');
	mainWindow.openDevTools();
	var template = [
	    { label: "App", submenu: [
	            { type: 'normal', label: "About Those Others App" },
	            { type: 'separator' },
	            { type: 'normal', label: 'Hide Others', role: 'hideothers', accelerator: 'Command+Alt+H' },
	            { type: 'normal', label: 'Show All', role: 'unhide' },
	            { type: 'separator' },
	            { type: 'normal', label: 'Quit', accelerator: 'Command+Q', click: function () { app.quit(); } }
	        ] },
	    { label: "Another", submenu: [
	            { type: 'normal', label: "About Those Others App" },
	            { type: 'separator' },
	            { type: 'normal', label: 'Hide Others', role: 'hideothers', accelerator: 'Command+Alt+H' },
	            { type: 'normal', label: 'Show All', role: 'unhide' },
	            { type: 'separator' },
	            { type: 'normal', label: 'DoSomething', accelerator: 'Command+Q', click: function () { console.log("do something"); } }
	        ] },
	    { label: "ATest", submenu: [
	            { type: 'normal', label: "About Those Others App" },
	            { type: 'separator' },
	            { type: 'normal', label: 'Hide Others', role: 'hideothers', accelerator: 'Command+Alt+H' },
	            { type: 'normal', label: 'Show All', role: 'unhide' },
	            { type: 'separator' },
	            { type: 'normal', label: 'Quit', accelerator: 'Command+Q', click: function () { app.quit(); } }
	        ] },	];
	Menu.setApplicationMenu(Menu.buildFromTemplate(template));
	// const menu = Menu.buildFromTemplate(template)
	// mainWindow.setMenu(menu)
  // Emitted when the window is closed.
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