
var fs = require('fs'),
    Promise = require('bluebird'),
    pem = require('pem'),
    tls = require('tls'),
    zlib = require('zlib');

class Certificate
{
    constructor()
    {
        this.servername = null
        this.key = null
        this.cert = null
        this.caCert = null
    }
    saveAsPk12(){
        
    }
}

class CertificateCache
{
    constructor(cacheFilePath){
        this.caKey = fs.readFileSync(__dirname + '/../cert/dummy.key', 'utf8'),
        this.caCert = fs.readFileSync(__dirname + '/../cert/dummy.crt', 'utf8'),
        this.serial = Math.floor(Date.now() / 1000),
        this.cache = {}
        // how about load all known secureContexts that have previously been constructed
        // ??
    }
    makeSNICallback(){
        return function(servername, cb){
            this.makeContextForServer(servername, cb)
        }.bind(this)
    }
    writeServerCertKey(servername)
    {
        var writeFileAsync = Promise.promisify(fs.writeFile)
        var dir = __dirname+'/../cert/'
        var certFile = dir+servername+".cert"
        var keyFile = dir+servername+".key"
        var utf = 'utf8'

        var writeCert = (keys) => {
            var f = (keys, cb) => {
                console.log("writeCertFile " + certFile)
                fs.writeFile(certFile, utf, keys.certificate, cb)
            }
            return Promise.promisify(f)
        }
        var writeKey = (keys) => {
            var f = (keys, cb) => {
                console.log("writeKeyFile " + keyFile)
                fs.writeFile(keyFile, utf, keys.clientKey, cb)
            }
            return Promise.promisify(f)
        }
        var test = (keys)=> {
            console.log("writeServerCertKey::test")
            var p = new Promise((resolve, reject)=>{
            console.log("writeServerCertKey::test resolve/reject")
                fs.writeFile(keyFile, "utf8", keys.clientKey, (err)=>{
                    if(err){
                        reject(err)
                    }else{
                        resolve(keys)
                    }
                })
            })
            return p;
        }
        return [writeCert, writeKey, test]

    }
    createServerCertificate(servername, cb){
    {
        this.pemMakeContextForServer(servername,cb)
    }
    pemMakeContextForServer(servername, cb){
        var createCertificateAsync = Promise.promisify(pem.createCertificate);

        if(!this.cache.hasOwnProperty(servername)) {
            // Slow path, put a promise for the cert into cache. Need to increment
            // the serial or browsers will complain.
            console.log('Generating new TLS certificate for: ' + servername);
            var certOptions = {
                commonName: servername,
                serviceKey: this.caKey,
                serviceCertificate: this.caCert,
                serial: this.serial++,
                days: 3650
            };



            var wrtPromises = this.writeServerCertKey(servername)

            var wrtCert = this.writeServerCertKey(servername)[0]
            var wrtKey = this.writeServerCertKey(servername)[1]
            var test = this.writeServerCertKey(servername)[2]

            console.log("wrtCert", test)

            this.cache[servername] = createCertificateAsync(certOptions)
                .then((keys)=>{
                    var p = new Promise((resolve, reject)=>{
                        pem.createPkcs12(keys.clientKey, keys.certificate, "", [this.caCert], (err, pk12)=>{
                            if(err){
                                reject(err)
                            }else{
                                console.log("writing pk12", pk12)
                                var dir = __dirname+'/../cert/'
                                fs.writeFile(dir+servername+".pk12", "utf8", pk12, (err)=>{
                                    if(err){
                                        reject(err)
                                    }else{
                                        resolve(keys)
                                    }
                                })
                            }
                        })
                    })
                    return p
                })
                .then((keys)=>{
                    //
                    // write servername.crt
                    // write servername.key
                    //
                    return tls.createSecureContext({
                        key: keys.clientKey,
                        cert: keys.certificate,
                        ca: this.caCert
                    }).context;
                })
                .catch((err)=>{
                    console.log(err)
                });
        }
        this.cache[servername].then(function (ctx) {
            cb(null, ctx);
        }).catch(function (err) {
            console.log('Error generating TLS certificate: ', err);
            cb(err, null);
        });
    }
}


module.exports = {
    CertificateCache : CertificateCache
};

