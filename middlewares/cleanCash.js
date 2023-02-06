const { clearHash } = require("../services/cash")

module.exports = async (req, res, next) => {
    //allow controller to run first then execute the middleware
    await next();
    clearHash(req.user.id)
}