/*globals describe, it, after, before */
var chai = require('chai');
var chaiHttp = require('chai-http');
var assert = chai.assert;
var app = require('../../app');
chai.use(chaiHttp);

var testServer = require('../fixture/test-server');
var testJSON = require('../fixture/test.json');

var TEST_URL = 'http://localhost:28080/';

describe('server integration', function(){
  var server = chai.request(app);

  before(function(done){
    testServer.listen('28080', done);
  });

  after(function(done){
    testServer.close(function(){
      done();
    });
  });

  it('should error without a url', function(done){
    chai.request(app).get('/without_url')
      .res(function(res){
        assert.equal(res.statusCode, 422);
        done();
      });
  });

  it('should succeed when the url is present', function(done){
    chai.request(app).get('/with_url')
      .req(function(req){
        req.query({ url: TEST_URL });
      })
      .res(function(res){
        Object.keys(res.body).forEach(function(key){
          assert.equal(res.body[key], testJSON[key]);
        });
        done();
      });
  });

});
