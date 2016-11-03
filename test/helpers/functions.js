const TestServers = require(__dirname+'/test-servers')
const Mitm = require(__dirname+"/../../src/mitm-server")

module.exports = {
	startHTTPSServers 	: startHTTPSServers,
	startHTTPServers  	: startHTTPServers,
	closeServers		: closeServers,
	testLogger			: testLogger,
}

function startHTTPSServers(serverPort, proxyPort, Options, cb){
	let remote = null;
	let mitm = null;
	remote = TestServers.createHttps()
	remote.listen(serverPort, "localhost", function(){
		mitm = new Mitm(Options)
		mitm.listen(proxyPort, "127.0.0.1", function(){
			cb(remote, mitm)
		})
	})	
}
function startHTTPServers(serverPort, proxyPort, Options, cb){
	let remote = null;
	let mitm = null;
	remote = TestServers.createHttp()
	remote.listen(serverPort, "localhost", function(){
		mitm = new Mitm(Options)
		mitm.listen(proxyPort, "127.0.0.1", function(){
			cb(remote, mitm)
		})
	})	
}

function closeServers(remote, mitm, done){
	remote.close(function(){
		mitm.close(()=>{
			done()
		})
	})	
}

/*
* A logger to use inside tests
*/
function testLogger(onOff){
	return (onOff)? console : {log: function noLog(){}}
}
