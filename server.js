// This code requires
// npm install express
// npm install node-env-file
// npm install ejs
// npm install query-string

/*
Consumer Key	
3MVG9yZ.WNe6byQAgQzsxT_h81H57SaphSHJTeHcR0g.xjp_HTRO.AW2kkE11dCv5wVq2jgBr_U6xHCJyJ_4t
Consumer Secret	
4708476571842879638
*/


// http://expressjs.com/en
var express = require('express');
// https://nodejs.org/api/http.html
var http = require('http');
// https://nodejs.org/api/https.html
var https = require('https');
// https://nodejs.org/api/fs.html
var fs = require('fs');
// https://github.com/grimen/node-env-file
var env = require('node-env-file');
// https://www.npmjs.com/package/query-string
const queryString = require('query-string');
// https://www.npmjs.com/package/https-proxy-agent
var HttpsProxyAgent = require('https-proxy-agent');

// Load environment variables for localhost
// Reads configuration from .env, if file does not exist then ignore
try {
// TROUBLESHOOTING env(__dirname + '/.env');
} catch (e) {}

// Create Express application
// http://expressjs.com/
var app = express();

// Define ports for HTTP and HTTPS
var port = process.env.PORT || 5000;
var https_port = process.env.HTTPS_PORT || parseInt(port) + 1;

// view engine: Default engine extension to use when omitted.
// http://expressjs.com/en/4x/api.html#app.settings.table
app.set('view engine', 'ejs');

// Mounts the middleware function(s) at the path.
app.use(express.static(__dirname + '/public'));

// Routes HTTP GET requests to the specified path with the specified callback functions.
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
console.log("Server listening for HTTP connections on port ", port);

// Create an HTTPS service if the certs are present
try
{
	// Heroku
	var options = {
		key: fs.readFileSync('key.pem'),
		cert: fs.readFileSync('key-cert.pem')
	};
	https.createServer(options, app).listen(https_port);
	console.log("Heroku Server listening for HTTPS connections on port ", https_port);
} catch (e)
{
	// localhost
	var options = {
		pfx: fs.readFileSync('./Burp_Certificate.pfx'),
		passphrase: 'sfdc1234'
	};
	https.createServer(options, app).listen(https_port);
	console.log("Localhost Server listening for HTTPS connections on port ", https_port);
}


// === MY Helper Functions === //
/*
Consumer Key	
3MVG9yZ.WNe6byQAgQzsxT_h81H57SaphSHJTeHcR0g.xjp_HTRO.AW2kkE11dCv5wVq2jgBr_U6xHCJyJ_4t
Consumer Secret	
4708476571842879638
Username
lcout@eltoro.it
Password
q@tg87287G3#
*/
function sfdcLoginOauthUNPW(callback) {
	var sfdcLoginOutput = null;
	var postData = {
		grant_type: "password",
		// —Consumer key from the connected app definition.
		client_id: "3MVG9yZ.WNe6byQAgQzsxT_h81H57SaphSHJTeHcR0g.xjp_HTRO.AW2kkE11dCv5wVq2jgBr_U6xHCJyJ_4t",
		// Consumer secret from the connected app definition.
		client_secret: "4708476571842879638",
		username: "lcout@eltoro.it",
		password: "q@tg87287G3#",
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

/*
function makeGetRequest(callback) {
	console.log("Calling WS: GET http://scooterlabs.com/echo?hello=world")
	var options = {
		protocol: "http:",
		hostname: "scooterlabs.com",
		port: 80,
		method: "GET",
		path: "/echo?" + queryString.stringify({helloWorldGET: new Date()}),
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
		}
	};
	
	var reqWS = http.request(options, function(resWS) {
		console.log('STATUS: ' + resWS.statusCode);
  		console.log('HEADERS: ' + JSON.stringify(resWS.headers));
  		resWS.setEncoding('utf8');
  		resWS.on('data', function(chunk) {
    		console.log('BODY: ' + chunk);
		});
		resWS.on('end', function() {
			console.log('No more data in response.');
			callback();
		})
	});
	reqWS.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	// write data to request body
	// reqWS.write(postData);
	reqWS.end();
}
function makePostRequest(callback) {
	console.log("Calling WS: POST http://scooterlabs.com/echo?hello=world");

	var postData = queryString.stringify({helloWorldPOST: new Date()});
	
	var options = {
		protocol: "http:",
		hostname: "scooterlabs.com",
		port: 80,
		method: "POST",
		path: "/echo",
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': postData.length,
		}
	};
	
	var reqWS = http.request(options, function(resWS) {
		console.log('STATUS: ' + resWS.statusCode);
		console.log('HEADERS: ' + JSON.stringify(resWS.headers));
		resWS.setEncoding('utf8');
		resWS.on('data', function(chunk) {
			console.log('BODY: ' + chunk);
		});
		resWS.on('end', function() {
			console.log('No more data in response.');
			callback();
		})
	});
	reqWS.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	// write data to request body
	reqWS.write(postData);
	reqWS.end();
}
function sfdcPing(sfdcLoginOutput, callback) {
	var options = {
		protocol: "https:",
		hostname: sfdcLoginOutput.instance_url.substr(sfdcLoginOutput.instance_url.indexOf('://')+3, sfdcLoginOutput.instance_url.length),
		port: 443,
		method: "GET",
		path: "/services/data/v35.0/limits",
		headers: {
			Authorization: 'Bearer ' + sfdcLoginOutput.access_token,
		}
	};
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
	options.agent = new HttpsProxyAgent('http://127.0.0.1:8080');
	console.log(options);
	
	var reqWS = https.request(options, function(resWS) {
		console.log('STATUS: ' + resWS.statusCode);
		console.log('HEADERS: ' + JSON.stringify(resWS.headers));
		resWS.setEncoding('utf8');
		resWS.on('data', function(chunk) {
			console.log('BODY: ' + chunk);
			chunk = JSON.parse(chunk);
			console.log("API Limit: " + chunk.DailyApiRequests.Remaining + " / " + chunk.DailyApiRequests.Max);
		});
		resWS.on('end', function() {
			console.log('No more data in response.');
			callback();
		})
	});
	reqWS.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	// write data to request body
	// reqWS.write(postData);
	reqWS.end();	
}
*/