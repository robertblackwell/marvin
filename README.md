#There is not much to say at this point

This is an electron app that is a poor mans Charles, and it is a long way from complete.

To build it and use it 

-	enter the command `npm run build`, This will make a folder called `Marvin-darwin-x64` inside of which will be `Marvin.app`.

-	Double click `Marvin.app` and it will be up and running with developers tools open. __BUT First a few more steps__

-	Once running it sets up a proxy of port 4001, to use this do the following.

	-	Test it with Firefox where you can set webproxy to localhost:4001 for both http and https without changing the system proxy.

	-	Since it will proxy https traffic as it stands you will also have to import into Firefox's root certificate store the certificate located at
`marvin/test/certificate-store/ca-cert.pem` and make it trusted. If you dont do this Firefox will ask you to accept a security risk when you try to access a https site. I have tested https with bankofamerica and wellsfargo which are quite complicated sites. 

-	Once this is done you should be ready to rock and roll.
-	Marvin displays each http(s) exchange as a single item in a list, click that item and you will see details of the request and response.
-	Currently the display of request/response body data is limited.