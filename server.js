var express = require('express');
var http = require('http');
var https = require('https');
var fs = require('fs');
var env = require('node-env-file');

var app = express();
var port = process.env.PORT || 5000;
var https_port = process.env.HTTPS_PORT || parseInt(port) + 1;
console.log('HTTP Port: ' + port);
console.log('HTTPS Port: ' + https_port);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
	console.log("Root Called!");
	res.render('test');
});
