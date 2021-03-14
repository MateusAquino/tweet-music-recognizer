main = async () => {
    const twitter = await require('./utils/twitter').load();
    const download = require('./utils/temporaryDownload');
    const identifyACR = require('./utils/identifyWithACR');
    const identifyShazam = require('./utils/identifyWithShazam');
    const checkRecognition = require('../controllers/Recognitions').check;
    const prettyMessage = require('./utils/prettyMessage');
    const youtubeCard = require('./utils/youtubeCard');

    twitter.stream(async (mediaURL, tweet, screenName, warnSpam) => {
        let id = tweet.id_str;

        // Already recognized?
        const setRecognized = await checkRecognition(mediaURL);
        if (typeof setRecognized === 'string')
            return twitter.replyTo(id, screenName, `twitter.com/me/status/${setRecognized}`);

        // Download Media
        let tempFile = await download(mediaURL);
        if (tempFile === false) return console.log('Couldn\'t download media');

        // Identify song
        let res = await identifyACR(tempFile);
        if (res==='405') return await twitter.replyTo(id, screenName, prettyMessage(res));
        res = res ? res : await identifyShazam(tempFile);
        console.log(res ? 'Song Identified: ' + res : 'No songs matching were found.');

        // Check for wrong song names
        let wrongsongs = JSON.parse(process.env.wrongsongs);
        if (res && wrongsongs && wrongsongs[res])
            res = wrongsongs[res];

        // Youtube Card
        const card = res ? await youtubeCard(res) : false;
        let message = warnSpam ? 'Por favor, não spamme o bot (e evite responder fancams me marcando)\n' : '';

        // Prettify output
        if (res && card) message += `${prettyMessage(res)} ${card}`;
        else if (res) message += `Não encontrei o vídeo mas o nome da música talvez seja '${res}'.`;
        else message += `${prettyMessage(res)}`;
        
        // Twitter's autoban hotfix
        message = message.replace(/memphis/ig, '[censurado]')

        // Reply & Add to already recognized list
        const reply = await twitter.replyTo(id, screenName, message);
        if (reply && reply.id_str)
            setRecognized(reply.id_str)

        // Delete temp files
        tempFile.delete();
    });
}

module.exports = main;
