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
	console.log(times);
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
	if (isSecured(reqHTTP)) {
		console.log('#ElToroIT: === === === ROOT CALLED === === === [' + new Date() + ']');
		sfdcLoginOauthUNPW(function(sfdcLoginOutput) {
			resHTTP.render('LCOut', {sfdcLoginOutput: sfdcLoginOutput});
		});
	} else {
		resHTTP.redirect('https://' + reqHTTP.headers.host + reqHTTP.url);
	}
});
app.get('/Blog.app', function(reqHTTP, resHTTP) {
	if (isSecured(reqHTTP)) {
		console.log('#ElToroIT: === === === BlogApp CALLED === === === [' + new Date() + ']');
		sfdcLoginOauthUNPW(function(sfdcLoginOutput) {
			resHTTP.render('LCOut', {sfdcLoginOutput: sfdcLoginOutput});
		});
	} else {
		resHTTP.redirect('https://' + reqHTTP.headers.host + reqHTTP.url);
	}
});

// Create an HTTP service
http.createServer(app).listen(port);
console.log('#ElToroIT: Server listening for HTTP connections on port ', port);

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
			console.log('#ElToroIT-02c: LoggedIn (all)', JSON.stringify(sfdcLoginOutput));
			console.log('#ElToroIT-02b: LoggedIn (id)', sfdcLoginOutput.id);
			console.log('#ElToroIT-02d: LoggedIn (issued_at)', sfdcLoginOutput.issued_at);
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




