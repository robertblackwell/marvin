/*
* Provides common set of configuation options for testing
*/
var fs = require('fs')
var path = require('path')
var cdir = path.resolve(__dirname+"/../certificate-store")
var caCert = cdir + "/cacert.pem"
var caKey = cdir + "/cakey.pem"
var certificatePath = path.resolve(__dirname + "/../certificate-store/cacert.pem");
var ca = fs.readFileSync(certificatePath, {encoding: 'utf-8'});


/**
* @config Options_object
*/
var flatOptions = {
	/**
	* These regex determine which requests and responses have their body content captured by the 
	* mitm. The purposes of these selectors is to ensure that we dont try to capture 
	* the body of large requests or responses entirely in a Buffer (the mitm forwarding
	* process uses piping to avoid fully capturing a body, the body only needs to
	* be captured for displaying/monitoring). For example images and videos
	* are prime candidates. They often are large files and there is usually little
	* interest in the content of the body of such requests or responses.
	* @attribute capture
	*/
	capture: [
		RegExp(/^text\/.*$/), 
		RegExp(/^application\/.*$/)				
	],

	/**
	* settings for monitoring https traffic
	*
	* paths to a directory where x509 certificates and keys will be stored for
	* each servername that Marvin intercepts. These are mandatory, Marvin cannot determine defaults for these
	* @attribute certDir
	*/
	certDir 	: cdir,
	/**
	* The path to the certificate for the Certificate Authority that will sign
	* all the servername certificates. This is also manditory as no sensible default is possible
	* @attribute caCertPath
	* @attribute caKeyPath
	*/
	caCertPath  : caCert,
	caKeyPath   : caKey,
	
	/**
	* CONNECT requests for hostname on any of these ports will be treated as a
	* https request. And if the servername matches one of the entries in {https_host}
	* then the request will be monitored and the request/response pair
	* provided. If the servername DOES NOT match one of {https_hosts}
	* the reuqested will be tunneled anonamously
	* @attribute https_hosts Regex to match hostnames
	*/
	https_hosts: [/^.*$/],		// regex to identify hosts that should invoke https mitm
	/**
	* @attribute https_ports - port numbers that will be treated as https ports
	*/
	https_ports: [443,9443], 	//ports that will trigger an https proxy
	
	/**
	* Determines how https operates to monitor https traffic. If sni is present and sni === true
	* a single https server backend handles all mitm monitoring for https traffic. That single server
	* uses the SNIcallback property of https.Server to act on behalf of multiple servernames.
	*
	* If sni === undefined or sni === false. A new backend https.Server instance is created for
	* each hostname. These are cached for reuse on subsequent requests to the same hostname 
	* @attribute {bool} sni - if tre use SNI version of HttpsSlaveMaster
	*/
	sni			: true, 

	// Log function - defaults to function noLog(){}
	log 		: function noLog(){}	
}

// var opt = {
// 	slaveMaster : {
// 		sni: true,
// 		certStore : {
// 	 		certDir 	: cdir,
// 	 		caCertPath  : caCert,
// 	 		caKeyPath   : caKey,
// 			log : function noLog(){}
// 		},
// 		log : function noLog(){}
// 	},
// 	response_content_to_capture :[
// 		RegExp(/^text\/.*$/),
// 		RegExp(/^application\/.*$/)
// 	],
// 	htts:{
// 		ports: [443,9443], 	//ports that will trigger an https proxy
// 		hosts: [/^.*$/],		// regex to identify hosts that should invoke https mitm
// 	},
// 	log : function noLog(){}
//
// }
//
// var certStoreOptions = opt.slaveMaster.certStore
// var slaveMasterOptions = opt.slaveMaster
// var mitmOptions = opt;

module.exports = flatOptions;
//
// module.exports = {
// 	options		: flatOptions,
// 	mitm 		: mitmOptions,
// 	slaveMaster	: slaveMasterOptions,
// 	certStore	: certStoreOptions,
// 	ca : ca
// }