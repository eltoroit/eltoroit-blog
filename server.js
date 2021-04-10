require('dotenv').config();
console.log('#ElToroIT: === === === SERVER RESTART === === === [' + new Date() + ']');

const express = require('express');					// http://expressjs.com/en
const http = require('http');						// https://nodejs.org/api/http.html
const https = require('https');						// https://nodejs.org/api/https.html
const fs = require('fs');							// https://nodejs.org/api/fs.html
const env = require('node-env-file');				// https://github.com/grimen/node-env-file
const queryString = require('query-string');		// https://www.npmjs.com/package/query-string


const app = express();
const port = process.env.PORT || 5000;
const https_port = process.env.HTTPS_PORT || parseInt(port) + 1;
console.log('#ElToroIT: HTTP Port: ' + port);
console.log('#ElToroIT: HTTPS Port: ' + https_port);

app.set('view engine', 'ejs');
// app.use(express.static(__dirname + '/public'));

app.use(
	express.static(__dirname + '/public'),
	function (req, res, next) {
		res.header("Access-Control-Allow-Origin", "*");
		res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
		next();
	}
);

// Test page.
var times = null;
app.get('/test', function (reqHTTP, resHTTP) {
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
app.get('/', function (reqHTTP, resHTTP) {
	console.log('#ElToroIT: === === === ROOT CALLED === === === [' + new Date() + ']');
	processLOutRequest(reqHTTP, resHTTP);
});
app.get('/Blog.app', function (reqHTTP, resHTTP) {
	console.log('#ElToroIT: === === === BLOG_APP CALLED === === === [' + new Date() + ']');
	processLOutRequest(reqHTTP, resHTTP);
});
app.get('/file', (reqHTTP, resHTTP) => {
	console.log('#ElToroIT: === === === FILE CALLED === === === [' + new Date() + ']');

	let options = null;
	let file = {
		attachmentId: reqHTTP.query.id
	}

	options = {
		method: 'GET',
		hostname: 'eltoroit.my.salesforce.com',
		path: `/services/data/v51.0/query?q=SELECT Id, IsDeleted, ParentId, Name, IsPrivate, ContentType, BodyLength, Body, OwnerId, CreatedDate, CreatedById, LastModifiedDate, LastModifiedById, SystemModstamp, Description FROM Attachment WHERE Id = '${file.attachmentId}'`,
		headers: {
			Authorization: `${loggedIn.sfdcLoginOutput.token_type} ${loggedIn.sfdcLoginOutput.access_token}`
		}
	};
	callWebService(options)
		.then(body => {
			file.metadata = JSON.parse(body.toString()).records[0];
			options.path = `/services/data/v51.0/sobjects/Attachment/${file.attachmentId}/body`;
			return callWebService(options);
		})
		.catch(error => {
			console.error('#ElToroIT-04: ERROR: problem with request: ', error);
		})
		.then(body => {
			file.body = body;
			resHTTP.set('Content-Type', file.metadata.ContentType);
			resHTTP.send(file.body);
			// debugger;
		})
		.catch(error => {
			console.error('#ElToroIT-05: ERROR: problem with request: ', error);
		})
});

app.get('/disqus', function (reqHTTP, resHTTP) {
	console.log('#ElToroIT: === === === DISQUS CALLED === === === [' + new Date() + ']');
	console.log(reqHTTP.query);
	resHTTP.render('disqus', { reqHTTP: reqHTTP });
});
app.get('/ArticleViewer', function (reqHTTP, resHTTP) {
	console.log('#ElToroIT: === === === OLD BLOG CALLED === === === [' + new Date() + ']');
	var urlBefore = reqHTTP.originalUrl;
	var urlAfter = "https://eltoro.secure.force.com" + urlBefore;
	console.log(urlAfter);
	resHTTP.redirect(urlAfter);
});
app.get('/:tagUsed', function (reqHTTP, resHTTP) {
	console.log('#ElToroIT: === === === TAG USED === === === [' + new Date() + ']');
	var urlAfter = "/Blog.app?page=" + reqHTTP.params.tagUsed;
	console.log(urlAfter);
	resHTTP.redirect(urlAfter);
});


// Create an HTTP service
http.createServer(app).listen(port);
console.log(`#ElToroIT: Server listening for HTTP connections on port: https://localhost:${port}`);

var loggedIn = {};
loggedInInitialize();
function loggedInInitialize() {
	var currentTime = new Date().valueOf();

	loggedIn = {};
	loggedIn.sfdcLoginOutput = null;
	loggedIn.timeOut = 10 * 60000; // 1 minute = 60,000 milliseconds
	loggedIn.expires = currentTime - (2 * loggedIn.timeOut); // Create it as already expired
}
function loggedInSave(sfdcLoginOutput) {
	loggedIn.sfdcLoginOutput = sfdcLoginOutput;

	var currentTime = new Date().valueOf();
	loggedIn.expires = currentTime + loggedIn.timeOut;
	sfdcLoginOutput.lightningUrl = sfdcLoginOutput.instance_url.replace("my.salesforce", "lightning.force");
}
function processLOutRequest(reqHTTP, resHTTP) {
	if (process.env.HEROKU === "YES") {
		// Is HTTPS?
		console.log('#ElToroIT: Secure?');
		if (!isSecured(reqHTTP)) {
			console.log('--- #ElToroIT: No, redirect!');
			resHTTP.redirect('https://' + reqHTTP.headers.host + reqHTTP.url);
			return;
		}
		console.log('--- #ElToroIT: Yes, continue!');
	}

	// Already logged in?
	console.log('#ElToroIT: Logged In? ');
	var currentTime = new Date().valueOf();
	var expired = loggedIn.expires < currentTime;
	console.log('--- #ElToroIT: SavedTime: ', loggedIn.expires);
	console.log('--- #ElToroIT: CurrentTime: ', currentTime);
	console.log('--- #ElToroIT: Expired?: ', expired);

	if (expired) {
		// Log in
		console.log('--- #ElToroIT: Logging in');
		sfdcLoginOauthUNPW(function (sfdcLoginOutput) {
			renderPage(reqHTTP, resHTTP, sfdcLoginOutput);
		});
	} else {
		// Use stored credentials
		console.log('--- #ElToroIT: Using stored credentials');
		renderPage(reqHTTP, resHTTP, loggedIn.sfdcLoginOutput);
	}
}
function renderPage(reqHTTP, resHTTP, sfdcLoginOutput) {
	resHTTP.render('LCOut', { sfdcLoginOutput: sfdcLoginOutput });
}
function sfdcLoginOauthUNPW(callback) {
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

	callWebService(options, postData)
		.then(body => {
			let sfdcLoginOutput = body.toString();
			sfdcLoginOutput = JSON.parse(sfdcLoginOutput);
			loggedInSave(sfdcLoginOutput)
			callback(sfdcLoginOutput);
		})
		.catch(error => {
			console.log('#ElToroIT-03: ERROR: problem with request: ', error);
		})
}
function isSecured(reqHTTP) {
	return (reqHTTP.headers['x-forwarded-proto'] == 'https');
}

function callWebService(options, postData = null) {
	return new Promise((resolve, reject) => {
		options.maxRedirects = 20;
		options.path = encodeURI(options.path);
		const req = https.request(options, (res) => {
			let chunks = [];
			res.on("error", (error) => { reject(error); });
			res.on("data", (chunk) => { chunks.push(chunk); });
			res.on("end", (chunk) => {
				let body = Buffer.concat(chunks);
				// console.log(body.toString());
				resolve(body);
			});
		});
		if (postData) {
			req.write(postData);
		}
		req.end();
	})
}



