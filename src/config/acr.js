var acrcloud = require('acrcloud');
const Config = require('../controllers/Config');

const load = async () => {
    const host = await Config.get('acr_host');
    const key_secret = await Config.get('acr_access_key_secret');
    if (!key_secret) return false;

    return new acrcloud({
        host: host,
        access_key: key_secret[0],
        access_secret: key_secret[1]
    })
}

module.exports.load = load;