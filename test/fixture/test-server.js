var http = require('http');
var fs = require('fs');
var path = require('path');
var testFile = path.resolve(__dirname + '/test.html');

module.exports = http.createServer(function(req, res){
  if(req.url === '/error' ){
    res.writeHead(500);
    return res.end();
  }
  fs.createReadStream(testFile).pipe(res);
});

