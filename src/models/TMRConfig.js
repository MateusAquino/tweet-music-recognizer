const mongoose = require('../config/database');

const ConfigSchema = new mongoose.Schema({
    acr_host: {
        type: String, default: ''
    },
    acr_access_key_secret: {
        type: String, default: ''
    },
    rapidapi_shazam_key: {
        type: String, default: ''
    },
    youtube_access_token: {
        type: String, default: ''
    },
    twitter_consumer_key: {
        type: String, default: ''
    },
    twitter_consumer_secret: {
        type: String, default: ''
    },
    twitter_access_token_key: {
        type: String, default: ''
    },
    twitter_access_token_secret: {
        type: String, default: ''
    },
    logs: {
        type: [String],
        default: []
    },
    stopRetrying: {
        type: String,
        default: ''
    },
    lastUpdatedDayMonth: {
        type: [Number, Number], 
        default: [0, 0]
    }
});

const TMRConfig = mongoose.model('TMRConfig', ConfigSchema);

module.exports = TMRConfig;