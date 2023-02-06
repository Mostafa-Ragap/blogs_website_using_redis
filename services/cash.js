const mongoose = require("mongoose")
const { redisClient } = require("../redis/redisConfig")
const util = require("util")
const exec = mongoose.Query.prototype.exec;
redisClient.hget = util.promisify(redisClient.hget)

mongoose.Query.prototype.cash = function (options = {}) {
    this.useCash = true;
    this.hashKey = JSON.stringify(options.key || '')
    return this
}


mongoose.Query.prototype.exec = async function () {
    if (!this.useCash) {
        return exec.apply(this, arguments)
    }

    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }))
    // see if we have a value for 'key' in redis
    console.log(`hget(${this.hashKey} , ${key})`);
    const cashValue = await redisClient.hget(this.hashKey, key)
    console.log({cashValue});
    //if we do , return that   
    if (cashValue) {
        
        console.log("SERVE FROM REDIS");
        const doc = JSON.parse(cashValue)
        return Array.isArray(doc) ? doc.map(d => this.model(d))
            : new this.model(doc)
    }
    //otherwise, issue the query and store the result in redis
    console.log("SERVE FROM MONGO");
    const result = await exec.apply(this, arguments)
    await redisClient.hset(this.hashKey, key, JSON.stringify(result), 'EX', 30)
    return result
}

module.exports = {
    clearHash(hashKey) {
        redisClient.del(JSON.stringify(hashKey))
    }
}