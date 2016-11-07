const path = require('path')


const preferenceController = new require("../src/viewer/controllers/preference-controller")()
const certBundleController = new require("../src/viewer/controllers/cert-bundle-controller")()
const certAuthController = new require("../src/viewer/controllers/cert-auth-controller")()

module.exports = function(app, mainWindow){
	return template = [
	    { 
	    	label: "App", submenu: [
	            { type: 'normal', label: "About Those Others App" },
	            // { type: 'separator' },
	            // { type: 'normal', label: 'Preferences', click : function(){preferenceController.show()} },
	            // { type: 'normal', label: 'Cert. Auth.', click : function(){certAuthController.show()} },
	            // { type: 'normal', label: 'Cert. Bundle', click : function(){certBundleController.show()} },
	            { type: 'separator' },
	            { type: 'normal', label: 'Quit', accelerator: 'Command+Q', click: function () { app.quit(); } }
	        ] 
	    },
	 //    { label: "Record", submenu: [
	 //            { type: 'normal', label: "Start" },
	 //            { type: 'normal', label: "Stop" },
	 //            { type: 'normal', label: "Clear", click: function(){
	 //            	console.log("main-menu::sending clear")
		// 			mainWindow.webContents.send("menu-record-clear", {})
	 //            } },
	 //        ] 
	 //    },
	 //    { label: "Filter", submenu: [
	 //            { type: 'normal', label: "Host Names Filter" },
	 //            { type: 'normal', label: "Content-type Filter" },
	 //        ] 
	 //    },
	 //    {  label: 'Window',
		//     role: 'window',
		//     submenu: [
		//       { label: 'Minimize', command: 'application:minimize' },
		//       { label: 'Zoom', command: 'application:zoom' },
		//       { type: 'separator' },
		//       { label: 'Bring All to Front', command: 'application:bring-all-windows-to-front' },
		//     ]
		// },
		// {
		// 	label: 'Help',
		// 	role: 'help',
		// 	submenu: [
		// 		{ label: 'Terms of Use', command: 'application:open-terms-of-use' },
		// 		{ label: 'Documentation', command: 'application:open-documentation' },
		// 		{ label: 'Frequently Asked Questions', command: 'application:open-faq' },
		// 		{ type: 'separator' },
		// 		{ label: 'Community Discussions', command: 'application:open-discussions' },
		// 		{ label: 'Report Issue', command: 'application:report-issue' },
		// 		{ label: 'Search Issues', command: 'application:search-issues' },
		// 		{ type: 'separator' }
		// 	]
		// }	
	];
}