const Twitter = require('twitter');
const Config = require('../controllers/Config');

load = async () => {
    const config = await Config.getConfig();

    const client = new Twitter({
        consumer_key: config.twitter_consumer_key,
        consumer_secret: config.twitter_consumer_secret,
        access_token_key: config.twitter_access_token_key,
        access_token_secret: config.twitter_access_token_secret
    });

    return client;
};

module.exports.load = load;