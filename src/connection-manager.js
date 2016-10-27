/**
* This comment is more by way of a design note as at the time of writting the classes in this file
* are really stubs.
*
* The plan is to have a connection manager that controls a pool of sockets that are connected to
* remote hosts (identified by host:port) and to keep at least a selection of these open
* so that we dont pay the overhead of creating a new connection on every "upStream" request.
*
* To achieve this the ConnectionManager will be a singleton (to manage one pool of connections)
* and exposes only one method "getConnectionForHostPort".
*
* The connection manager returns an instance of the "Connection" class asynchronouly to each 
* call to"getConnectionHostPort" and this "Connection" knows how to send Http and Https
* rquests. 
*
* Now in the real world each host:port combination also implies a protocol as the listener on
* that host:port knows what protocol it is able to speak. But we have to inform the connection manager
* (and hence the connection) what the protocol is so that it knows what type of message to send.
* Hence the getConnectionForHostPort takes a protocol (http or https) parameter, and connections
* store the protocol in an instance variable as well as the host:port 
*
* Like nodejs http.request and https.request a connection is a stream and the body of a request
* can be piped into the connection instance
*/
const http = require('http')
const assert = require('assert')

/**
* The V0 versions of these two classes are a simple/dumb implementation
*/
class ConnectionV0{
	constructor(protocol, host, port){
		
	}
	httpRequest(options, cb){
		return http.request(options, cb)
	}
}
class ConnectionManagerV0{
	constructor(options){
		
	}
	getConnectionForHostPort(protocol, host, port, cb){
		let conn = new ConnectionV0(protocol, host, port)
		cb(null, conn)
	}
}

class Connection{
	
	static estabish(protocol, host, port, cb){
		let conn = new Connection(protocol. host, port);
		cb(null, conn)
	}
	constructor(protocol, host, port){
		this.manager = getConnectionManager()
		this.protocol = protocol;
		this.host = host;
		this.port = port;
		this.id = protocol+":"+host+":"+port;
		this.inUse = false;
		this.timeout = false;
		this.httpRequestObject = false
	}
	httpRequest(options, cb){
		let localCb = (resp)=>{
			console.log("senHttpRequest - localCb", this)
			this.manager.releaseConnection(this)
			cb(resp)
		}
		this.httpRequestObject = http.request(options, localCb)
		return this.httpRequestObject;
	}
	httpsRequest(){
		
	}
	markInUse(){
		this.inUse = true
	}
	release(){
		this.inUse = false
	}
}

class ConnectionManager{
	
	constructor(options){
		this.maxConnections = 10;
		this.connections = [];
	}
	findExistingAvailableConnectionFor(host, port){
		for( c of this.connections){
			if(c.host === host && c.port === port && c.port.inUse == false){
				c.inUse = true;
				return c;
			}
		}
		return false;
	}
	getConnectionForHostPort(protocol, host, port, cb){
		let connNew =  new Connection(protocol, host, port);
		connNew.inUse = true;
		this.connections.push(connNew)
		cb(null, connNew)
		return;
		
		let id = host+":"+port;
		let conn = this.findExistingAvailableConnectionFor(host,port);
		if( conn === false ){
			conn = Connection.establish(protocol, host, port, (err, c)=>{
				c.inUse = true;
				if( c.timer ) clearTimeout(c.timeout)
				this.connections.push(c);
				cb(null, c)				
			}) //This should be async - if we need to do net.connect call
		}else{
			conn.inUse = true;
			conn.timeout = null;
			cb(null, conn)
		}
	}
	removeConnection(conn){
		let ix = this.connections.indexOf(conn)
		assert(ix !== null, "removeConnection - conn not found")
		this.connections.splice(ix,1)
	}
	releaseConnection(conn){
		console.log("ConnectionManager::releaseConnection", conn)
		conn.inUse = false;
		conn.timeout = setTimeout(()=>{
			console.log("Connectionmanager::timeout cb", conn)
			conn.timeout = null;
			this.removeConnection(conn)
		}, 1000)
		console.log("ConnectionManager::releaseConnection", conn)
		
	}
}
const theConnectionManager = new ConnectionManagerV0();
function getConnectionManager(){return theConnectionManager;}
module.exports = theConnectionManager;