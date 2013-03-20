var _ = require('lodash');
var request = require('request');
var cheerio = require('cheerio');
var redis = require('redis');
var config = require('config');

// Redis Instance
//
var r = config.redis;
var client = redis.createClient(r.port, r.host, r);
if( r.pass ) client.auth(r.pass);

/*
 * Retrieves open graph meta tags from a url
 */
function processUrl(url, req, res){
  request(url, function(err, resp, body){
    var $ = cheerio.load(body);
    var key = 'url:'+ url;
    var tagList = $('meta[property]');
    var graphProperties = {};

    _.each(tagList, function(tag){
      var $tag = $(tag);
      var prop = $tag.attr('property');
      var content = $tag.attr('content');

      if( /^\d+$/.test(content) ){
        content = parseInt(content, 10);
      }

      if( prop && content ){
        graphProperties[ prop ] = content;
      }
    });

    client.multi()
      .hmset(key, graphProperties)
      .expire(key, 86400)
      .exec(function(err){
        console.log(err);
      });

    res.json(graphProperties);
  });
}

/*
 * GET home page.
 */

exports.index = function(req, res){
  var url = req.query.url;
  if( !url ){
    res.send(412);
    return;
  }

  client.hgetall('url:'+ url, function(err, result){
    if( err ){
      res.send(500);
      return;
    }

    if( result === null ){
      processUrl(url, req, res);
    } else {
      res.json(result);
    }
  });
};
