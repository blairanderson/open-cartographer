/*globals describe, it, after, before */
var assert = require('chai').assert;
var sinon = require('sinon');
var opengraph = require('../../lib/opengraph');
var testServer = require('../fixture/test-server');
var testJSON = require('../fixture/test.json');

var TEST_URL = 'http://localhost:28080/';

describe('opengraph', function(){
  before(function(done){
    testServer.listen('28080', function(){
      opengraph.client.select(1, function(err){
        if(err) throw new Error(err);
        done();
      });
    });
  });

  after(function(done){
    testServer.close(function(){
      opengraph.client.flushdb(function(err){
        if(err) throw new Error(err);
        done();
      });
    });
  });

  describe('get', function(){
    it('should make a graph request', function(done){
      opengraph.get(TEST_URL + 'unique', function(err, result){
        Object.keys(result).forEach(function(key){
          assert.equal(result[key], testJSON[key]);
        });

        done();
      });
    });

    it('should make a graph request and call processUrl', function(done){
      var spy = sinon.spy(opengraph, 'processUrl');
      var url = TEST_URL + (+new Date());

      opengraph.get(url, function(err, result){
        assert.ok( spy.calledOnce );
        assert.ok( spy.calledWith(url) );
        spy.restore();
        done();
      });
    });

    it('should pull from cache on susequent requests', function(done){
      var spy = sinon.spy(opengraph, 'processUrl');

      opengraph.get(TEST_URL, function(err, result){
        assert.equal( spy.callCount, 0 );
        spy.restore();
        done();
      });
    });
  });

  describe('parseTag', function(){
    it('should strip `og:` from tag keys', function(){
      var obj = {};
      opengraph.parseTag('og:foo', 'bar', obj);
      assert.property(obj, 'foo');
    });

    it('should convert numeric strings to numbers', function(){
      var obj = {};
      opengraph.parseTag('foo', 123, obj);
      assert.equal(obj.foo, 123);
    });

    it('should merge duplicate properties', function(){
      var obj = {};
      opengraph.parseTag('foo', 'bar', obj);
      opengraph.parseTag('foo', 'biz', obj);
      assert.deepEqual(obj.foo, ['bar', 'biz']);
      opengraph.parseTag('foo', 'baz', obj);
      assert.deepEqual(obj.foo, ['bar', 'biz', 'baz']);
    });
  });

  describe('processUrl', function(){
    it('should store a key for a given url', function(done){
      opengraph.processUrl(TEST_URL + '2', function(){
        opengraph.client.exists(TEST_URL + '2', function(){
          done();
        });
      });
    });

    it('should error if it recieves a non 200 status', function(done){
      opengraph.processUrl(TEST_URL + 'error', function(err){
        assert.equal(err, 'Error recieved while requesting: http://localhost:28080/error');
        done();
      });
    });


    it('should error if it can\'t find anything', function(done){
      opengraph.processUrl('http://localhost:2808080', function(err){
        assert.equal(err, 'Error: connect ECONNREFUSED');
        done();
      });
    });
  });

});
