var http=require('http');
var path = require('path');
var conn = require('./connection.js');

var server=http.createServer(function(req,res){
	res.writeHead(200, {"Content-Type": "text/plain"});
    	conn.connect(function (err) {
    		if (!err) {
			res.end('Conn Ok');
		} else {
			res.end('Conn No');
		}
	});
});

server.on('listening',function(){
    console.log('ok, server is running');
});

server.listen(3010);