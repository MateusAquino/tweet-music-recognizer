const { promisify } = require('util');
const Config = require('../../controllers/Config');

let recentRequests = {};
let current2Hours = 13;
let cooldown = 5;

class Twitter {
    static online = false;

    constructor() {
        Twitter.client = require('../../config/twitter').load();
    }

    static stream(callback) {
        console.log('Starting stream...')
        if (Twitter.online) Twitter.online.destroy();

        Twitter.client.stream('statuses/filter', {
            track: process.env.mentioning
        }, stream => {
            Twitter.online = stream;
            // Data Function
            const dataFn = event => {
                Twitter.online = stream;
                if (!Twitter.isTweet(event, true)) {
                    if (event.disconnect) {
                        console.log("Disconnect:")
                        console.log(event.disconnect);
                        (stream.removeAllListeners | (()=>{}))('data');
                        setTimeout(()=>Twitter.stream(callback), 7000);
                    }
                    return;
                }
                Twitter.mediaUrlAntiSpam(event, callback);
            };

            // Error Function
            const errorFn = async error => {
                Twitter.online = false;
                console.log('Error: failed to link stream listener to Twitter.');
                console.log(error.message ? error.message : 'End of stream.');
                if (!await Config.get('stopRetrying')) {
                    console.log(`Retrying in ${cooldown}s...`);
                    setTimeout(()=>Twitter.stream(callback), cooldown*1000);
                    if (cooldown === 5) cooldown = 10;
                    else if (cooldown === 10) cooldown = 60;
                    else if (cooldown === 60) cooldown = 120;
                    else if (cooldown === 120) cooldown = 240;
                    else if (cooldown === 240) cooldown = 420;
                    else if (cooldown === 420) cooldown = 1020;
                    else  cooldown = 5;
                }
            };

            // Stream
            stream.on('data', dataFn);
            stream.on('error', errorFn);
            stream.on('end', errorFn);
        });
    }

    static async mediaUrlAntiSpam(tweet, callback) {
        const parentTweet = tweet.in_reply_to_status_id_str;
        const childUsername = tweet.user.screen_name;
        const videoUrl = await Twitter.getVideoURL(parentTweet);
        if (!videoUrl) return;
        let warnSpam = false;
        
        // ANTI-SPAM
        var twoHours = Math.floor(new Date().getHours()/2.0); 
        if (current2Hours != twoHours) {
            current2Hours = twoHours;
            recentRequests = {};
        }
        if (!recentRequests[childUsername]) recentRequests[childUsername] = 1
        else recentRequests[childUsername] = recentRequests[childUsername] + 1
        if (recentRequests[childUsername] === 3)
            warnSpam = true;
        else if (recentRequests[childUsername] > 3) {
            Twitter.client.post('blocks/create.json', {
                screen_name: childUsername,
                skip_status: 1
            }, ()=>{console.log(`${childUsername} foi bloqueado(a) por spam.`)});
            return;
        }
        
        callback(videoUrl, tweet, childUsername, warnSpam);
    }

    static async getTweet(id) {
        const get = promisify(
            (endpoint, options, cb) => Twitter.client.get(
                endpoint, 
                options,
                (err, ...results) => cb(err, results)
            )
        );
        try {
            let tweet = await get('statuses/lookup', {
                id,
                tweet_mode: 'extended' // Importante para obter a URL do vídeo
            });
            if (tweet && tweet[0] && tweet[0][0] && Twitter.isTweet(tweet[0][0]))
                return tweet[0][0];
            return false;
        } catch (err) { 
            if (err && err[0])
                console.log('[Error] Twitter: ' + err[0].message)
        }
        return false;
    }

    static async getVideoURL(id) {
        const tweet = await Twitter.getTweet(id);
        if (tweet === undefined) return false; // Tweet não é um reply
        if (tweet.extended_entities === undefined) return false; // Tweet sem mídia
        if (tweet.extended_entities.media[0].video_info === undefined) return false; // Tweet sem video
        const mediaURL = tweet.extended_entities.media[0].video_info.variants[0].url;
            for (let media of tweet.extended_entities.media[0].video_info.variants)
                if (media.content_type === 'video/mp4')
                    return media.url;
        return mediaURL;
    }

    static isTweet(event, isReply = false) {
        const isString = obj => typeof obj === 'string' || obj instanceof String;
        return isString(event.id_str) 
            && (isString(event.text)||isString(event.full_text)) 
            && (isReply ? isString(event.in_reply_to_status_id_str) : true)
            && (isReply ? event.text.includes(process.env.mentioning) : true);
    }

    static replyTo(tweetId, screenName, content) {
        return new Promise(resolve => {
            const postData = ['statuses/update', {
                in_reply_to_status_id: tweetId,
                status: `@${screenName} ${content}`
            }];

            Twitter.client.post(...postData, (err, tweet, response) => {
                console.log(`Tweet sent!`)
                resolve(tweet);
            });
        });
    }
}

module.exports.load = async () => {
    new Twitter();
    Twitter.client = await Twitter.client;
    return {
        /** 
         *  @param callback - 0: media url
         *  @param callback - 1: tweet
         *  @param callback - 2: username
         *  @param callback - 3: warn spam
        */
        stream: callback => Twitter.stream(callback),
        getTweet: Twitter.getTweet,
        getVideoURL: Twitter.getVideoURL,
        replyTo: Twitter.replyTo
    }
}