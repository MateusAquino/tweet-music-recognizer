require('dotenv').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const listr = require('listr');
const app = require('./config/server.js');
const cliente = require('./config/twitter.js');
const searchYoutube = require('youtube-api-v3-search');

if (process.env.twitter_consumer_key === "XXXXX") {
    console.log("Warning! This script won't run properly without tokens and keys (Twitter, ACR & Youtube Data).");
    console.log("Please set them up in your .env file before running (Check README.md)")
    return;
}

//Configura o host disponível (Heroku) ou "0.0.0.0"
var server_host = process.env.YOUR_HOST || '0.0.0.0';
//Configura a porta disponível (Heroku) ou a porta 3000
var server_port = process.env.YOUR_PORT || process.env.PORT || 3000;

app.listen(server_port, server_host, function () {
    console.log("Application: online.");
});

app.get('/', (req, res) => {
    res.send('This application is online.');
});

// Primeira função a ser executada
function setupTwitter() {
    cliente.stream('statuses/filter', {
        track: '@nomemusica'
    }, function (stream) {
        // Quando alguem fizer uma @mention
        stream.on('data', function (event) {
            const parentTweet = event.in_reply_to_status_id_str;
            const childTweet = event.id_str;
            const parentUsername = event.in_reply_to_screen_name;
            const childUsername = event.user.screen_name;
            const postData = ['statuses/update', {
                in_reply_to_status_id: childTweet,
                status: `@${parentUsername} @${childUsername} `
            }];
            replyWithSong(parentTweet, postData);
        });

        stream.on('error', function (error) {
            console.log('Error: failed to link stream listener to Twitter.');
        });
    });
}

// Responde o tweet (tweetID) com a musica que será encontrada
async function replyWithSong(tweetID, postData) {
    await getTwitterMp4URL(tweetID, url => {
        downloadTempMp4File(url, (resolve, task, reject) => {
            const acr = setupACR();            // ACR = API para identificar fingerprints de audios e
            task.title = 'Identifying song...' // obter os dados da música (nome, artista, ...)
            task.output = '';
            identifyTempMp4(acr, song => {
                let songName = "";
                if (song === "404") {
                    task.title = "Fingerprint failed!";
                    postData[1].status += `Não consegui identificar a música :(`;
                    cliente.post(...postData, () => reject(`ACRCloud could not detect song for TwID: ${tweetID}!`)); // Envia tweet + log console
                    return;
                }
                for (s of song[0].artists)
                    songName += s.name + ", ";
                songName = songName.slice(0, -2) + ' - ' + song[0].title; // Resultado Final: "Artist1, Artist2, ... - Song Name"
                task.output = ('Searching for', songName);
                youtubeSearch(songName, search => { // Era opcional, mas por estética optei por mandar um card do youtube
                    task.title = search;
                    postData[1].status += `${songName} https://youtu.be/${search}`; // Add o card do youtube no tweet
                    cliente.post(...postData, resolve); // Envia tweet
                });
            });
        });
    });
}

// Obtem a URL de um vídeo do Twitter
function getTwitterMp4URL(tweetID, callback) {
    cliente.get('statuses/lookup', {
        id: tweetID,
        tweet_mode: 'extended' // Importante para obter a URL do vídeo
    }, function (error, tweet, event) {
        if (tweet[0] === undefined) return; // Tweet não é um reply
        if (tweet[0].extended_entities === undefined) return; // Tweet sem mídia
        if (tweet[0].extended_entities.media[0].video_info === undefined) return; // Tweet sem video
        const mediaURL = tweet[0].extended_entities.media[0].video_info.variants[0].url;
        callback(mediaURL);
    });
}

// Baixa um .mp4 da Web para o arquivo ./temp.mp4
function downloadTempMp4File(url, callback) {
    function one(tasks) {
        tasks.run();
    }
    if (process.argv) {
        const tasks = [{
            title: 'Downloading',
            output: url,
            task: async (ctx, task) => {
                const tempFile = path.resolve(__dirname, 'temp.mp4')
                const response = await axios({
                    url,
                    method: 'GET',
                    responseType: 'stream'
                })
                response.data.pipe(fs.createWriteStream(tempFile))
                return new Promise((resolve, reject) => {
                    response.data.on('end', () => {
                        callback(resolve, task, reject);
                    })
                    response.data.on('error', err => {
                        reject(err)
                    })
                })
            }
        }]
        one(new listr(tasks));
    }
}

function setupACR() {
    const acrcloud = require('acrcloud');
    const acr = new acrcloud({
        host: process.env.acr_host,
        access_key: process.env.acr_access_key,
        access_secret: process.env.acr_access_secret
    });
    return acr;
}

// Utiliza o ACR para identificar a música do arquivo ./temp.mp4
function identifyTempMp4(acr, callback) {
    const fs = require("fs");
    const sample = fs.readFileSync("./temp.mp4");

    acr.identify(sample).then(metadata => {
        const statusMsg = metadata.status.msg;
        callback(statusMsg === 'Success' ? metadata['metadata']['music'] : '404');
    });
}

// Obtem o id do vídeo do youtube pela pesquisa "Artista - Música"
async function youtubeSearch(query, callback) {
    const search = await searchYoutube(process.env.youtube_access_token, {
        q: query,
        part: 'snippet',
        type: 'video'
    });
    callback(search['items'][0]['id']['videoId']);
}

setupTwitter();
