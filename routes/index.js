var _ = require('lodash');
var request = require('request');
var cheerio = require('cheerio');

/*
 * GET home page.
 */

exports.index = function(req, res){
  var url;
  if( req.body && req.query.url ){
    url = req.query.url;

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

      res.json(graphProperties);
    });
  } else {
    res.send(412);
  }
};
