const Config = require('../controllers/Config')
const html = process.cwd() + '/src/render/Administration.html';

class Administration {
    static async userInterface(req, res) {
        const config = await Config.getConfig();
        config.logs = config && config.logs ? config.logs.join('\n') : [];
        config.pass = process.env.backendpass;
        
        res.render(html, config);
    }

    static async setConfigs(req, res) {
        if (req.body.restream)
            require('../recognition/index')();
        else {
            const update = JSON.parse(JSON.stringify(req.body));
            update.stopRetrying = update.stopRetrying ? 'checked' : '';
            await Config.setConfigs(update);
        }

        res.redirect('/adm?pass='+process.env.backendpass);
    }

    static async addLog(log, defaultLog=()=>{}, isError = false) {
        log = typeof log === 'array' ? log.join(' ') : log;
        log = log && log.toString ? log.toString() : log;
        log = isError ? '[!] ' + log : log;
        defaultLog(log);
        await Config.addLog(log);
    }
}

module.exports = Administration;