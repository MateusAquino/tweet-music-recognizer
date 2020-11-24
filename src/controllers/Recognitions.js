const statusHashRgx = /video\/([^\/]+)(?:\/[^\/]+){3}\/([^\/?]+)/;
const Recognitions = require('../models/Recognitions');

class RecognitionsController {
    static check = async mediaURL => {
        let statusHash;
        if ((statusHash = statusHashRgx.exec(mediaURL))[2])
            statusHash = `${statusHash[1]}/${statusHash[2]}`
        else
            statusHash = mediaURL;

        let recognition = await Recognitions.findOne({ mediaURL: statusHash });
        if (recognition) 
            return recognition.responseId;
        else 
            return async responseTweetId =>
                await Recognitions.insertMany({ mediaURL: statusHash, responseId: responseTweetId })
    }
}

module.exports.check = RecognitionsController.check;