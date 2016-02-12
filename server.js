console.log('#ElToroIT: === === === SERVER RESTART === === === [' + new Date() + ']');

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

// Test page.
var times = null;
app.get('/test', function(reqHTTP, resHTTP) {
	var result = '';
	if (times) {
		times++;
	} else {
		times = 5;
	}
	if (times > 15) times = 5;
	result += 'Times: ' + times + '<br/>';
	for (var i = 1; i <= times; i++) {
		result += i + '. cool!<br/>';
	}
	result += '<hr/>' + new Date();
	resHTTP.send(result);
});

// Blog pages
app.get('/', function(reqHTTP, resHTTP) {
	console.log('#ElToroIT: === === === ROOT CALLED === === === [' + new Date() + ']');
	processLOutRequest(reqHTTP, resHTTP);
});
app.get('/Blog.app', function(reqHTTP, resHTTP) {
	console.log('#ElToroIT: === === === BlogApp CALLED === === === [' + new Date() + ']');
	processLOutRequest(reqHTTP, resHTTP);
});

// Create an HTTP service
http.createServer(app).listen(port);
console.log('#ElToroIT: Server listening for HTTP connections on port ', port);

var loggedIn = {};
loggedIn.sfdcLoginOutput = null;
loggedIn.timeOut = 1 * 60000; // 1 minute = 60,000 milliseconds
loggedIn.expires = new Date(new Date() - (2*loggedIn.timeOut)); // Create it as already expired
function processLOutRequest(reqHTTP, resHTTP) {
	// Is HTTPS?
	console.log('#ElToroIT: Secure?');
	if (!isSecured(reqHTTP)) {
		console.log('--- #ElToroIT: No, redirect!');
		resHTTP.redirect('https://' + reqHTTP.headers.host + reqHTTP.url);
		return;
	}
	console.log('--- #ElToroIT: Yes, continue!');
	
	// Already logged in?
	console.log('#ElToroIT: Logged In? ', loggedIn);
	var currentTime = new Date();
	var expired = loggedIn.expires < currentTime;
	console.log('--- #ElToroIT: CurrentTime: ', currentTime);
	console.log('--- #ElToroIT: Expired?: ', expired);
	
	if (expired) {
		// Log in
		console.log('--- #ElToroIT: Logging in');
		sfdcLoginOauthUNPW(function(sfdcLoginOutput) {
			renderPage(reqHTTP, resHTTP, sfdcLoginOutput);
		});		
	} else {
		// Use stored credentials
		console.log('--- #ElToroIT: Using stored credentials: ', loggedIn);
		renderPage(reqHTTP, resHTTP, loggedIn.sfdcLoginOutput);
	}
}
function renderPage(reqHTTP, resHTTP, sfdcLoginOutput) {
	resHTTP.render('LCOut', {sfdcLoginOutput: sfdcLoginOutput});
}
function sfdcLoginOauthUNPW(callback) {
	var sfdcLoginOutput = '';
	var postData = {
		grant_type: "password",
		// —Consumer key from the connected app definition.
		client_id: process.env.clientId,
		// Consumer secret from the connected app definition.
		client_secret: process.env.clientSecret,
		username: process.env.username,
		password: process.env.password,
		format: "json"
	};
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
	
	var reqWS = https.request(options, function(resWS) {
		resWS.setEncoding('utf8');
		resWS.on('data', function(chunk) {
			sfdcLoginOutput += chunk;
		});
		resWS.on('end', function() {
			sfdcLoginOutput = JSON.parse(sfdcLoginOutput);
			loggedIn.sfdcLoginOutput = sfdcLoginOutput;
			var expiresAt = new Date();
			console.log('1-' + expiresAt);
			expiresAt += loggedIn.timeOut;
			console.log('2-' + expiresAt);
			expiresAt += new Date(expiresAt);
			console.log('3-' + expiresAt);
			loggedIn.expires = expiresAt;
			console.log('--- #ElToroIT: Credentials stored: ', JSON.stringify(loggedIn));
			callback(sfdcLoginOutput);
		})
	});
	reqWS.on('error', function(e) {
		console.log('#ElToroIT-03: ERROR: problem with request: ' + e.message);
	});

	// write data to request body
	reqWS.write(postData);
	reqWS.end();
}
function isSecured(reqHTTP) {
	return (reqHTTP.headers['x-forwarded-proto']=='https');
}




