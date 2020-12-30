const TMRConfig = require('../models/TMRConfig');
const { Types } = require('../config/database');

const _id =  Types.ObjectId('4edd40c86762e0fb12000003');

class Config {
    static async getConfig(){
        let config = await TMRConfig.findOne({ _id });
        if (!(config && config._id)) config = (await TMRConfig.insertMany({ _id }))[0];
        if (config._doc) config = config._doc;
        return config;
    }

    static async setConfigs(config) {
        return await TMRConfig.collection.updateOne({ _id }, {$set: config});
    }

    static async addLog(log) {
        if (log && typeof log === 'string' && !log.includes('method=GET path='))
        TMRConfig.collection.updateOne({ _id }, {
            $push: {
                logs: {
                    $each: ['> '+log],
                    $slice: -200
                }
            }
        });
    }

    static async get(field) {
        const search = { _id: 0, lastUpdatedDayMonth: 1 };
        search[field] = 1;
        let config = await TMRConfig.findOne({ _id }, search);
        if (config._doc) config = config._doc;
        await Config.refreshDate(config);
        config = Config.parseKeys(field, config);
        return config;
    }

    static apis = {
        'acr_access_key_secret': [2, 100],
        'rapidapi_shazam_key': [1, 500]
    };
    static parseKeys(keyName, config) {
        let api;
        if (api = Config.apis[keyName]) {
            const parsed = config[keyName].split('\n').map(e=>e.split(/ *, */))
            let key = 0;
            for (key in parsed)
                if (parseInt(parsed[key][api[0]]) < api[1]) {
                    parsed[key][api[0]] = parseInt(parsed[key][api[0]])+1;
                    const newKeys = parsed.map(el=>el.join(', ')).join('\n')
                    const update = {};
                    update[keyName] = newKeys;
                    TMRConfig.collection.updateOne({ _id }, { $set: update });
                    break;
                } else if (key-1===parsed.length) return false;
            return parsed[key];
        } else if (keyName.trim()==='youtube_access_token') {
            let keysArray = config[keyName].split(/ *, */);
            return keysArray[Math.floor(Math.random() * keysArray.length)];
        } else
            return config[keyName];
    }

    static async refreshDate(config) {
        if (!config.lastUpdatedDayMonth) return;
        const now = new Date();
        let newConfig = null;
        if (config.lastUpdatedDayMonth[0] !== now.getDate()) {
            newConfig = await Config.getConfig();
            newConfig.lastUpdatedDayMonth[0] = now.getDate();
            newConfig.acr_access_key_secret = 
                newConfig.acr_access_key_secret.split('\n').map(key=>{
                    key = key.split(/, */);
                    return `${key[0]}, ${key[1]}, 0`;
                }).join('\n');
        }
        if (config.lastUpdatedDayMonth[1] !== now.getMonth()) {
            newConfig = newConfig ? newConfig : await Config.getConfig();
            newConfig.lastUpdatedDayMonth[1] = now.getMonth();
            newConfig.rapidapi_shazam_key = 
                newConfig.rapidapi_shazam_key.split('\n').map(key=>{
                    key = key.split(/, */);
                    return `${key[0]}, 0`;
                }).join('\n');
        }
        if (newConfig) await Config.setConfigs(newConfig);
    }
}

module.exports = Config;