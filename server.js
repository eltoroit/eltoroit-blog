var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var env = require('node-env-file');

var app = express();
var port = process.env.PORT || 5000;
var https_port = process.env.HTTPS_PORT || parseInt(port) + 1;
console.log('#ElToroIT: HTTP Port: ' + port);
console.log('#ElToroIT: HTTPS Port: ' + https_port);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.get('/test', function(request, response) {
	var result = ''
	var times = process.env.TIMES || 5
	for (i=0; i < times; i++) {
		result += 'cool!<br/>';
	}
	result += new Date();
	response.send(result);
});
app.get('/', function(reqHTTP, resHTTP) {
	sfdcLoginOauthUNPW(function(sfdcLoginOutput) {
		resHTTP.render('LCOut', {sfdcLoginOutput: sfdcLoginOutput});
	});
});
app.get('/Blog.app', function(reqHTTP, resHTTP) {
	sfdcLoginOauthUNPW(function(sfdcLoginOutput) {
		resHTTP.render('LCOut', {sfdcLoginOutput: sfdcLoginOutput});
	});
});

// Create an HTTP service
http.createServer(app).listen(port);
console.log("#ElToroIT: Server listening for HTTP connections on port ", port);

// Create an HTTPS service if the certs are present
try {
	var options = {
	  key: fs.readFileSync('key.pem'),
	  cert: fs.readFileSync('key-cert.pem')
	};
	https.createServer(options, app).listen(https_port);
	console.log("#ElToroIT: Server listening for HTTPS connections on port ", https_port);
} catch (e) {
	console.error("#ElToroIT: Security certs not found, HTTPS not available");
}

function sfdcLoginOauthUNPW(callback) {
	var sfdcLoginOutput = null;
	var postData = {
		grant_type: "password",
		// —Consumer key from the connected app definition.
		client_id: process.env.clientId,
		// Consumer secret from the connected app definition.
		client_secret: process.env.clientSecret,
		username: process.env.username,
		password: process.env.password,
		format: "json",
	};
	console.log('postData', postData);
	postData = queryString.stringify(postData);
	
	var options = {
		protocol: "https:",
		hostname: "login.salesforce.com",
		port: 443,
		method: "POST",
		path: "/services/oauth2/token",
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': postData.length,
		}
	};
	console.log('options', options);
	
	var reqWS = https.request(options, function(resWS) {
		resWS.setEncoding('utf8');
		resWS.on('data', function(chunk) {
			sfdcLoginOutput = JSON.parse(chunk);
		});
		resWS.on('end', function() {
			console.log('sfdcLoginOutput', sfdcLoginOutput);
			callback(sfdcLoginOutput);
		})
	});
	reqWS.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	// write data to request body
	reqWS.write(postData);
	reqWS.end();
}




