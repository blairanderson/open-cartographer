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

function handleJSON(err, graphProperties){
  if( err ){
    console.error('Error: '+ err +'|url: '+ this.url);
    return this.res.json(500, { error: 'An error occurred processing: ' + this.url });
  }

  if( this.req.query && this.req.query.callback ){
    this.res.send(this.res.query.callback +'('+ JSON.stringify(graphProperties) +')');
  } else {
    if( graphProperties.embed ){
      try {
        graphProperties.embed = JSON.parse(graphProperties.embed);
      } catch(e){ }
    }
    this.res.json(graphProperties);
  }
}

app.get('*', function(req, res){
  var url = req.method === 'GET' ? req.query.url : req.body.url;

  var options = {
    url: url,
    embed: req.query.embed ? true : false
  };

  if( /\/embed/.test(req.url) ){
    options.embed = true;
  }

  if( url === undefined ){
    var error = 'URL is undefined';
    return res.json(422, { error: error });
  } else {
    url = decodeURIComponent(url);
  }

  var context = {
    req: req,
    res: res,
    url: url
  };

  opengraph.get(options, handleJSON.bind(context));
});

module.exports = app;
