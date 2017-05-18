/* global __dirname */

var express = require('express');
var os = require('os');
var path = require('path');
var bodyParser = require('body-parser');

//var disk = require('diskusage');

console.log('SIMULATOR TELCO & SMS BY MOBIWIN');
console.log('------------------------------');
// Monitoring
console.log('Operating system \t : ' + os.platform() + ' ' + os.arch() + ' ' + os.type());
console.log('Memory Capacity \t : ' + parseInt(os.totalmem()) / 1000000 + ' Mb');
console.log('Free Memory \t \t : ' + parseInt(os.freemem()) / 1000000 + ' Mb');
console.log('Home Dir \t \t : ' + os.homedir());
console.log('Hostname \t \t : ' + os.hostname());

// Disk
console.log('------------------------------');

//Including Telco Routing
var xl = require('./routes/telco/xl');
var isat = require('./routes/telco/isat');
var tsel = require('./routes/telco/tsel');
var hutch = require('./routes/telco/hutch');

//Including User
var user = require('./routes/users/user');

var app = express();

//View Engine
app.set('view engine', 'pug');
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({// to support URL-encoded bodies
    extended: true
}));

//Use Routing App for Telco
app.use('/xl', xl);
app.use('/isat', isat);
app.use('/tsel', tsel);
app.use('/hutch', hutch);

//Use Routing for User
app.use('/u', user);

//Error Handling
app.get('*', function (req, res) {
    res.status(404).send('Page Not Found');
});

// Server
app.listen(3010, function () {
    console.log('Simulator Turn On : port 3010!');
});