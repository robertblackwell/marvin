all: cert whiteacorn http https

cert:
	mocha cert.js

whiteacorn:
	mocha proxy_whiteacorn.js

http:
	mocha http_direct
	mocha http.js

https:
	node https-ex.js
	mocha https.js
