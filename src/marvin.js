const commander 			= require('commander');
const child_process			= require('child_process')
const path 					= require('path')
function main(){
let version = "somthing"
	
commander.version(version)
commander.option("-v, --verbose", "Verbose mode display progress reports")
commander.option("-t, --trace [level]", "Debug mode display detailed trace information")
commander.option("-d, --dry", "Dry run prints results to stdout but does not update files or server")
commander.option("-c, --config <path>", "the path to a configuration file instead of the default")

//
// Here is a sample of how argument and options are passed.
//
// Arguments are passed to the action function in the order defined,
// a value is passed even if the arg is optional and NOT provided.
//
// The last parameter to the action function is an "options" object
// and the options provided are accessed as properties of that object.
//
// When a value is not provided for the option --zebra, but the option is
// provided - a value of true is passed to the action function.
//
// Global options (those defined ahead of | outside of commands), are accessed
// via commander.<option-name>
//
//
commander.command('test <one> [two]')
	.description("a command to explore how node-commander handles arguments and options")
	.option("-u, --username <uname>", "user name to use for accessing marvin.io")
	.option("-f, --configfile <configfile>", "specify a config file")
	.option("-p, --password <pword>", "password to use for accessing marvin.io. If present will\n"
				+"be stored in OSX keychain")
	.option("-z, --zebra [which]", "ca specify a zerba if you want")
	.action(function(one, two, options){
		console.log("marvin-test 1", one);
		console.log("marvin-test 2", two);
		console.log("marvin-start configfile", options.configfile);
		console.log("marvin-test username", options.username);
		console.log("marvin-test password", options.password);
		console.log("marvin-test zebra", options.zebra);
		console.log("marvin-test verbose", commander.verbose); 
	})

commander.command('start')
	.description("start the marvin proxy montor")
	.option("-f, --configfile <configfile>", "specify a config file")
	.option("-z, --zebra [which]", "can specify a zerba if you want")
	.action(function(options){
		const electron = path.resolve(__dirname+"/../node_modules/.bin/electron");
		const mainjs = path.resolve(__dirname + "/../main.js")
		let args = [mainjs]
		let configfile = ""
		if( options.configfile !== undefined ){
			configfile = path.resolve(process.cwd() +"/"+ options.configfile)
			args.push(configfile)
		}
		
		console.log("exec("+electron + " " + mainjs + " " + configfile+")")
		let cp = child_process.spawn(electron, args, {
			stdio: "inherit",
			detach: true
		})
		cp.on('exit', (code, signal)=>{
			console.log("marvin ui exited : code : " + code, "signal : ", signal)
		})	
		// child_process.spawn(electron, args,  (err, stdout, stderr)=>{
		// 	console.log("electron ended", err, stdout, stderr)
		// })
	})

commander.command('init')
	.description("initialize a marvin instance in this folder/director - will create a ./marvin.js file")
	.option("-m, --home <homepath>", "specify a folder for the initial config file")
	.action(function(options){
	})

commander.command('init-config')
	.description("create an initial config file in $(HOME)/.marvin/config.js")
	.option("-m, --home <homepath>", "specify a folder for the initial config file")
	.action(function(options){
	})

commander.command('ca-create')
	.description("create a certificate authority and certificate store")
	.option("-f, --folder <cadir>", "specify a folder/dir in which the certificate store will be created")
	.action(function(options){
	})
	
commander.on("*", function(a,b,c){
	console.log("GOT * EVET",a,b,c)
	console.log("unknow command, run:", "marvin -h")
})
commander.parse(process.argv)

}
module.exports = main;
function mm(){
console.log("marvin")
}