openssl genrsa -out ./testdata/ca.key 1024

openssl req -new -x509 \
	-days 3650 \
	-extensions v3_ca \
	-keyout ./testdata/cakey.pem \
	-out ./testdata/cacert.pem \
	-nodes \
	-subj "/C=US/ST=STATE/L=CITY/O=ORG/CN=CERT_NAME"

echo \"02\" > ./testdata/cacert.srl