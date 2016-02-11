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
app.get('/', function(req, res) {
	var result = ''
	var times = process.env.TIMES || 5
	for (i=0; i < times; i++) {
		result += 'cool!<br/>';
	}
	result += new Date();
	response.send(result);
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







