exports.redis = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
};

if( process.env.REDIS_PASS ){
  exports.redis.pass = process.env.REDIS_PASS;
}

