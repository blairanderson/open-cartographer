var _ = require('lodash');
var request = require('request');
var cheerio = require('cheerio');
var redis = require('redis');
var config = require('config');
var opengraph = exports;

// Redis Instance
//
var r = config.redis;
var client = redis.createClient(r.port, r.host, r);
if( r.pass ) client.redisClient.auth(r.pass);

// RegEx's
var isDigit = /^\d+$/;
var stripOg = /^og:/;

opengraph.EXPIRES = 86400;

opengraph.client = client;

// parseTag - prepares the raw tag content and adds it to the graphProperties
// object
opengraph.parseTag = function(prop, content, graphProperties){
  prop = prop.replace(stripOg, '');

  if( isDigit.test(content) ){
    content = parseInt(content, 10);
  }

  if( graphProperties[prop] === undefined ){
    graphProperties[prop] = content;
  } else if( _.isArray(graphProperties[prop]) ){
    graphProperties[prop].push( content );
  } else {
    graphProperties[prop] = [ graphProperties[prop] ];
    graphProperties[prop].push( content );
  }
};

// processUrl - retreives open graph data from a url, stores the result in Redis
opengraph.processUrl = function(url, cb){
  request(url, function(err, resp, body){
    if(err){
      return cb(err);
    }

    if( resp.statusCode !== 200 ){
      return cb('Error recieved while requesting: '+ url);
    }

    var $ = cheerio.load(body);
    var key = 'url:'+ url;
    var graphProperties = {};

    function processTags(i ,tag){
      var $tag = $(tag);
      var prop = $tag.attr('property') || $tag.attr('type');
      var content = $tag.attr('content') || $tag.attr('href');

      if( prop && content ){
        opengraph.parseTag(prop, content, graphProperties);
      }
    }

    $('meta[property]').each(processTags);
    $('link[type="application/json+oembed"]').each(processTags);

    client.multi()
      .hmset(key, graphProperties)
      .expire(key, opengraph.EXPIRES)
      .exec(function(err){
        if(err){
          console.error('Redis Error '+ err);
          return cb(err);
        }
        cb(null, graphProperties);
      });
  });
};

// get - interface for fetching URL, first from cache and then by requesting it
opengraph.get = function(url, cb){
  client.hgetall('url:'+ url, function(err, result){
    if( err ){
      return cb(err);
    }

    return result === null ? opengraph.processUrl(url, cb) : cb(null, result);
  });
};
