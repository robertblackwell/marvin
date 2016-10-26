#openssl genrsa -out ./testdata/ca.key 1024
CDIR=./certificate-store
COUNTRY=US
STATE=Washington
CITY=Seattle
ORG=BlackwellApps
CANAME=MarvinCertificateAuthority
## -new without -key causes a new key to be generated
openssl req -new -x509 \
	-days 3650 \
	-extensions v3_ca \
	-sha256 \
	-keyout ${CDIR}/cakey.pem \
	-out ${CDIR}/cacert.pem \
	-nodes \
	-subj "/C=${COUNTRY}/ST=${STATE}/L=${CITY}/O=${ORG}/CN=${CANAME}"

echo \"02\" > ${CDIR}/cacert.srl