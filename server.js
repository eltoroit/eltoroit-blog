console.log('#ElToroIT: === === === SERVER RESTART === === === [' + new Date() + "]");

var express = require('express');				// http://expressjs.com/en
var http = require('http');						// https://nodejs.org/api/http.html
var https = require('https');					// https://nodejs.org/api/https.html
var fs = require('fs');							// https://nodejs.org/api/fs.html
var env = require('node-env-file');				// https://github.com/grimen/node-env-file
const queryString = require('query-string');	// https://www.npmjs.com/package/query-string

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
	console.log("#ElToroIT: Root Called');
	sfdcLoginOauthUNPW(function(sfdcLoginOutput) {
		resHTTP.render('LCOut', {sfdcLoginOutput: sfdcLoginOutput});
	});
});
app.get('/Blog.app', function(reqHTTP, resHTTP) {
	console.log("#ElToroIT: Blog.app Called');
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
	console.log('#ElToroIT-REMOVE COMMENT: postData', postData);
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
	console.log('#ElToroIT-REMOVE COMMENT: options', options);
	
	var reqWS = https.request(options, function(resWS) {
		resWS.setEncoding('utf8');
		resWS.on('data', function(chunk) {
			console.log('#ElToroIT-REMOVE COMMENT: Received chunk');
			sfdcLoginOutput = JSON.parse(chunk);
		});
		resWS.on('end', function() {
			console.log('#ElToroIT-REMOVE COMMENT: Completed');
			console.log('#ElToroIT-FIXED COMMENT: sfdcLoginOutput', sfdcLoginOutput);
			callback(sfdcLoginOutput);
		})
	});
	reqWS.on('error', function(e) {
		console.log('#ElToroIT-ERROR: problem with request: ' + e.message);
	});

	// write data to request body
	reqWS.write(postData);
	reqWS.end();
}




