const mongoose = require('mongoose');
const redis = require('redis');
const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);

const util = require('util');
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
    this.hashKey = JSON.stringify(options.key || '');

    this.useCache = true;
    return this;
}


mongoose.Query.prototype.exec = async function() {

    if (!this.useCache) {
        return exec.apply(this, arguments);
    }

    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }));

    // do we have any cache data in redis related to this query
    const cachedValue = await client.hget(this.hashKey, key);

    //if yes then respons to the request right away and return
    if (cachedValue) {
        const doc = JSON.parse(cachedValue);
        return Array.isArray(doc) ?
            doc.map(d => new this.model(d)) :
            new this.model(doc);
    }

    //if no, we need to respond to request and update our cache to store the data
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result));
    return result;
}


module.exports = {
    clearHash(hashKey) {
        client.del(JSON.stringify(hashKey));
    }
}