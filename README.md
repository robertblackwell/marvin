#There is not much to sa at this point

This is an electron app that is a poor mans Charles, and it is a long way from complete.

To build it and use it 

	-	`npm run build`, This will make a folder called `Marvin-darwin-x64` inside of which will be `Marvin.app`.

	-	Double click that app and it will be up and running with developers tools open. BUT First a few more steps

	-	Once running it sets up a proxy of port 4001, to use this do the following.

		-	To test it use Firefox where you can set webproxy to localhost:4001 for both http and https
without changing the system proxy.

		-	You will also have to import into Firefox's root certificate store the certificate located at
`marvin/test/certificate-store/ca-cert.pem` and make thi trusted.

	-	Once this is done you should be ready to rock and roll.