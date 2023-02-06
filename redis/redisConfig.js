const redis = require("redis")
const redisUrl = process.env.redisUrl
exports.redisClient = redis.createClient(redisUrl)

