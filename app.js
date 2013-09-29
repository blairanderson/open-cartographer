var express = require('express');
var path = require('path');
var opengraph = require('./lib/opengraph');

//
// Express instance
//
var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.use(express.logger('dev'));
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(function(req, res, next){
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Accept, Content-Length, Content-MD5, Content-type');

    if( res.method === 'OPTIONS' ){
      return res.send(204);
    }
    next();
  });
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

app.get('*', function(req, res){
  var url = req.method === 'GET' ? req.query.url : req.body.url;

  var options = {
    url: url,
    embed: req.query.embed ? true : false
  };

  if( url === undefined ){
    var error = 'URL is undefined';
    return res.json(422, { error: error });
  } else {
    url = decodeURIComponent(url);
  }

  opengraph.get(options, function(err, graphProperties){
    if( err ){
      console.error('Error: '+ err +'|url: '+ url);
      return res.json(500, { error: 'An error occurred processing: ' + url });
    }

    if( req.query && req.query.callback ){
      res.send(res.query.callback +'('+ JSON.stringify(graphProperties) +')');
    } else {
      if( graphProperties.embed ){
        try {
          graphProperties.embed = JSON.parse(graphProperties.embed);
        } catch(e){ }
      }
      res.json(graphProperties);
    }
  });
});

module.exports = app;
