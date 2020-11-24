const rateLimit = require('express-rate-limit');
const limitMiddleware = rateLimit({ 
                        windowMs: 60 * 60000, // 1h
                        max: 100, 
                        message: 'wooo, you goin\' too fast! calm down wont ya...'});

auth = (req, res, next) => {
    return limitMiddleware(req, res, ()=>{
        if ((req.body && req.body.pass  === process.env.backendpass)
        || (req.query && req.query.pass === process.env.backendpass))
            next();
        else res.status(401).send('Wrong password.')
    });
}

module.exports = auth;