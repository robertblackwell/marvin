PWD=$(shell pwd)

CERTDIR=$(PWD)/testdata
CAKEYPAIR=$(CERTDIR)/ca.key
CAKEY=$(CERTDIR)/cakey.pem
CACERT=$(CERTDIR)/cacert.pem

dump:
	@echo $(PWD)
	@echo Certificater Directory $(CERTDIR)
	@echo CA Key Pair : $(CAKEYPAIR)
	@echo CA key : $(CAKEY)
	@echo CA Cert : $(CACERT)

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
	
ca:
	echo "make ca"
	@openssl genrsa -out $(CAKEYPAIR) 1024
	@openssl req -new -x509 \
		-days 3650 \
		-extensions v3_ca \
		-keyout ./testdata/cakey.pem \
		-out ./testdata/cacert.pem \
		-nodes \
		-subj "/C=US/ST=STATE/L=CITY/O=ORG/CN=CERT_NAME"
	@echo \"02\" > ./testdata/cacert.srl
