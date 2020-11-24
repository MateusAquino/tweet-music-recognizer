const fs = require("fs");
const axios = require('axios');

downloadTempMp4File = async url => {
    const hash = (Math.random().toString(36)+'00000000000000000').slice(2, 7);

    const tempFile = process.cwd() + `/src/recognition/temp/${hash}.mp4`;
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })
    response.data.pipe(fs.createWriteStream(tempFile));
    try {
        await new Promise((resolve, reject) => {
            response.data.on('end', resolve)
            response.data.on('error', reject)
        });
        const sample = fs.readFileSync(tempFile);
        const pathRaw = tempFile.split('mp4')[0]+'raw';
        return {
            sample,
            hash,
            path: tempFile,
            pathRaw,
            delete: () => {
                fs.existsSync(tempFile) ? fs.unlink(tempFile, err => { if (err) console.error(err); }) : false
                fs.existsSync(pathRaw) ? fs.unlink(pathRaw, err => { if (err) console.error(err); }) : false
            }
        }
    } catch (err) {
        console.log(err)
        return false;
    }
}

module.exports = downloadTempMp4File;