var _ = require('lodash');
var request = require('request');
var cheerio = require('cheerio');
var redis = require('redis');
var config = require('config');

// Redis Instance
//
var r = config.redis;
var client = redis.createClient(r.port, r.host, r);
if( r.auth ) client.auth(r.auth);


/*
 * GET home page.
 */


function processUrl(req, res){
  var url = req.query.url;

  request(url, function(err, resp, body){
    var $ = cheerio.load(body);
    var metatags = $('meta[property]');
    var graphProperties = {};

    _.each(metatags, function(tag){
      var $tag = $(tag);
      var prop = $tag.attr('property');
      var content = $tag.attr('content');

      if( prop && content ){
        graphProperties[ prop ] = content;
      }
    });

    client.hmset('url:'+ url, graphProperties, function(err){ });
    client.expire('url:'+ url, 86400);

    res.json(graphProperties);
  });
}

exports.index = function(req, res){
  if( req.query && req.query.url ){

    var url = req.query.url;
    client.exists('url:'+ url, function(err, exists){
      if( err ){
        res.send(500);
        return;
      }

      if( exists ){
        client.hgetall('url:'+ url, function(err, result){
          if( err ){
            res.send(500);
            return;
          }
          res.json(result);
        });
      } else {
        processUrl(req, res);
      }

    });

  } else {
    res.send(412);
  }
};
