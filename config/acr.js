var fs = require('fs');
var acrcloud = require('acrcloud');
var keys = process.env.acr_access_key.split(/, ?/);
var secrets = process.env.acr_access_secret.split(/, ?/);
var utcdate = new Date().getUTCDate();

module.exports = function (cb) {
    // Obtem dados no formato "dia:qntUsos"
    fs.readFile('usesPerDay', 'utf8', function(err, data) {
        const dayUses = data.split(":");
        var newUses;
        if (utcdate === parseInt(dayUses[0]))
            newUses = parseInt(dayUses[1])+1;
        else
            newUses = 1;

        // Salva dados no formato "dia:qntUsos" (+1)
        fs.writeFile('usesPerDay', `${utcdate}:${newUses}`, ()=>{
            keyNum = Math.floor((newUses-1)/100);
            keyNum = keyNum >= keys.length ? 0 : keyNum;
            var acr = new acrcloud({
                host: process.env.acr_host,
                access_key: keys[keyNum],
                access_secret: secrets[keyNum]
            })
            cb(acr);
        }); 
    });
};