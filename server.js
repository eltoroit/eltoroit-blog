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
app.get('/test', function(reqHTTP, resHTTP) {
	var result = '';
	var times = process.env.TIMES || 5;
	for (i=0; i < times; i++) {
		result += 'cool!<br/>';
	}
	result += '<hr/>' + new Date();
	resHTTP.send(result);
});
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

/*
// Create an HTTPS service if the certs are present
try {
	var options = {
	  key: fs.readFileSync('key.pem'),
	  cert: fs.readFileSync('key-cert.pem')
	};
	https.createServer(options, app).listen(https_port);
	console.log('#ElToroIT: Server listening for HTTPS connections on port ', https_port);
} catch (e) {
	console.error('#ElToroIT: Security certs not found, HTTPS not available');
}
*/

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
			console.log('#ElToroIT: On Data: Chunk: ', chunk);
			sfdcLoginOutput += chunk;
		});
		resWS.on('end', function() {
			console.log('#ElToroIT: On End: ' + sfdcLoginOutput);
			console.log('#ElToroIT: LoggedIn', sfdcLoginOutput.id);
			console.log('#ElToroIT: LoggedIn (all)', JSON.stringify(sfdcLoginOutput));
			console.log('#ElToroIT: LoggedIn (issued_at)', JSON.stringify(sfdcLoginOutput.issued_at));
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
function isSecured(reqHTTP) {
	return (reqHTTP.headers['x-forwarded-proto']=='https');
}




