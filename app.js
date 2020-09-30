require('dotenv').config();
const fs = require('fs');
const axios = require('axios');
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

let logList = [], log = console.log;
console.log = (...args) => { logList.push(...args); log(...args); if (logList.length>200) logList.splice(0,100)};


app.get('/logs', (req, res) => {
    usesPerDay = fs.readFileSync('usesPerDay', 'utf8').split(':')[1];
    usesPerMonth = fs.readFileSync('usesPerMonth', 'utf8').split(':')[1];

    let fulllog = '<style>body {background-color:white;}</style>' +
    `Used today (ACR): ${usesPerDay}<br/>Used this month (Shazam): ${usesPerMonth}<br/><br/><b>Logs:</b><br/><pre><code>`;
    for (let l of logList) {
        fulllog += l + '\n';
    }
    fulllog += '</code></pre>';
    res.send(fulllog);
});

app.get('/', (req, res) => {
    res.send('This application is online.');
});

let recentRequests = {};
let current2Hours = 13;

// Primeira função a ser executada
function setupTwitter() {
    cliente.stream('statuses/filter', {
        track: '@nomemusica' // Quando alguem fizer uma @mention
    }, function (stream) {
        stream.on('data', function (event) {
            const parentTweet = event.in_reply_to_status_id_str;
            const childTweet = event.id_str;
            const parentUsername = event.in_reply_to_screen_name;
            const childUsername = event.user.screen_name;
            const postData = ['statuses/update', {
                in_reply_to_status_id: childTweet,
                status: `@${childUsername} `       // Removed ${parentUsername} 
            }];
            var twoHours = Math.floor(new Date().getHours()/2.0);
            if (current2Hours != twoHours) {
                current2Hours = twoHours;
                recentRequests = {};
            }

            if (!recentRequests[childUsername]) recentRequests[childUsername] = 1
            else recentRequests[childUsername] = recentRequests[childUsername] + 1
            if (recentRequests[childUsername] === 3)
                postData[1].status += 'Por favor, não spamme o bot (e evite responder fancams me marcando)\n'
            else if (recentRequests[childUsername] > 3) {
                cliente.post('blocks/create.json', {
                    screen_name: childUsername,
                    skip_status: 1
                }, ()=>{console.log(`${childUsername} foi bloqueado(a) por spam.`)});
                return;
            }

            replyWithSong(parentTweet, postData);
        });

        stream.on('error', function (error) {
            console.log('Error: failed to link stream listener to Twitter.');
            console.log(error);
            console.log('Retrying in 5s...');
            setTimeout(()=>setupTwitter(), 5000);
        });
    });
}

// Responde o tweet (tweetID) com a musica que será encontrada
async function replyWithSong(tweetID, postData) {
    const hash = (Math.random().toString(36)+'00000000000000000').slice(2, 7); // Gera Hash aleatório de 5 caracteres

    await getTwitterMp4URL(tweetID, url => {
        downloadTempMp4File(url, hash, () => {
            const acr = require('./config/acr.js');  // ACR = API para identificar fingerprints de audios e
            console.log('Identifying song...');      // obter os dados da música (nome, artista, ...)
            identifyTempMp4(acr, hash, song => {
                let songName = "";
                if (song === "404") {
                    console.log("ACR Fingerprint failed!");
                    if (!process.env.rapidapi_shazam_key.includes('optional')) { // Se tiver a key do Shazam
                        identifyTempMp4Shazam(hash, song => {
                            fs.unlink(`./tempVideos/${hash}.mp4`, (err) => { if (err) console.error(err); });
                            if (song === "404") {
                                console.log("Shazam Fingerprint failed!");
                                postData[1].status += randomMsg(song);
                                cliente.post(...postData, () => console.log(`ACRCloud & Shazam could not detect song for TwID: ${tweetID}!`)); // Envia tweet + log console
                                return;
                            } else if (song === "405") {
                                console.log("Shazam's API Limit exceed!");
                                postData[1].status += randomMsg(song);
                                cliente.post(...postData, () => console.log(`ACRCloud could not detect song for TwID: ${tweetID}!`)); // Envia tweet + log console
                                return;
                            }

                            searchYTCardAndSend(song, postData); // search & send
                        });
                        return;
                    } else {
                        fs.unlink(`./tempVideos/${hash}.mp4`, (err) => { if (err) console.error(err); });
                        postData[1].status += randomMsg(song);
                        cliente.post(...postData, () => console.log(`ACRCloud could not detect song for TwID: ${tweetID}!`)); // Envia tweet + log console
                        return;
                    }
                }
                fs.unlink(`./tempVideos/${hash}.mp4`, (err) => { if (err) console.error(err); });
                for (s of song[0].artists)
                    songName += s.name + ", ";
                songName = songName.slice(0, -2).replace(';', ', ') + ' - ' + song[0].title; // Resultado Final: "Artist1, Artist2, ... - Song Name"

                searchYTCardAndSend(songName, postData); // search & send
            });
        });
    });
}

function searchYTCardAndSend(songName, postData) {
    console.log(`Searching yt ID for: '${songName}'`);
    youtubeSearch(songName, search => {                                 // Era opcional, mas por estética optei por mandar um card do youtube
        if (search==='404') {
            console.log(`Youtube video ID not found!`);    
            postData[1].status += `Não encontrei o vídeo mas o nome da música talvez seja ${songName}`;
        } else {
            console.log(`Found: '${search}'`);
            postData[1].status += `${randomMsg(songName)} https://youtu.be/${search}`; // Add o card do youtube no tweet
        }

        cliente.post(...postData, (error, tweet, response) => {
            if (error) console.log('Failed to tweet:', error)
            else console.log('Tweet sent!')
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
        for (let media of tweet[0].extended_entities.media[0].video_info.variants) {
            if (media.content_type === 'video/mp4') {
                callback(media.url);
                return;
            }
        }    
        callback(mediaURL);
    });
}

// Baixa um .mp4 da Web para o arquivo ./temp.mp4
async function downloadTempMp4File(url, hash, callback) {
    const tempFile = process.cwd() + `/tempVideos/${hash}.mp4`;
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    })
    response.data.pipe(fs.createWriteStream(tempFile));
    return new Promise(() => {
        response.data.on('end', () => {
            callback();
        })
        response.data.on('error', () => {
            console.log('Failed to download source.');
        })
    })
}

// Utiliza o ACR para identificar a música do arquivo ./temp.mp4
function identifyTempMp4(acr, hash, callback) {
    const fs = require("fs");
    const sample = fs.readFileSync(process.cwd() + `/tempVideos/${hash}.mp4`);
    acr(api => api.identify(sample).then(metadata => {
        const statusMsg = metadata.status.msg;
        callback(statusMsg === 'Success' ? metadata['metadata']['music'] : '404');
    }));
}

function identifyTempMp4Shazam(hash, callback) {
    const shazam = require('./config/shazam.js');
    shazam(process.cwd() + `/tempVideos/${hash}.mp4`, song => callback(song));
}

// Obtem o id do vídeo do youtube pela pesquisa "Artista - Música"
async function youtubeSearch(query, callback) {
    const search = await searchYoutube(process.env.youtube_access_token, {
        q: query,
        part: 'snippet',
        type: 'video'
    });
    if (search['items'][0])
        callback(search['items'][0]['id']['videoId']);
    else 
        callback('404');
}

// Anti-spam (random messages)
function randomMsg(resultado) {
    var pick = array => array[Math.floor(Math.random() * array.length)];
    switch (resultado) {
        case '404':
            return pick(['Não consegui identificar a música :(', 
                         'Desculpa, não encontrei esse audio no banco... 👉👈',
                         'Juro que procurei por 72 milhões de faixas e não encontrei essa :(',
                         'Deu ruim... não encontrei essa musica 🥺',
                         'Falhei em encontrar sua música, por favor me perdoe 😖',
                         'Eu tinha um trabalho, e falhei com você 🤧',
                         'Essa musica aparentemente não está no meu banco :c',
                         'Não consegui reconhecer essa música :c',
                         'Adorei a musica mas infelizmente não sei o nome dela :/',
                         'Uou! essa eu nao conheço 😳',
                         'Nn vou saber te dizer essa, desculpa :/']);
        case '405':
            return pick(['Acabou o limite mensal de uso da API :(\nTalvez você possa me ajudar criando uma Key Basic em rapidapi.com/apidojo/api/shazam e enviando na dm! c:',
                         'Desculpa, a API que eu uso é gratuita e terminou a minha cota de uso :c\nSe quiser ajudar, você pode criar uma Basic Key em rapidapi.com/apidojo/api/shazam e me enviar na dm!',
                         'Deu ruim... 😳\nSó tenho alguns usos por mês na API :c Maaas, se quiser me ajudar a aumentar, da pra criar uma Key Basic no rapidapi.com/apidojo/api/shazam/details e me mandar na dm :d',
                         'O bot não tem mais usos nesse mês! D:\nAcabou os usos mensais, porém se quiser ajudar a aumentar, cria uma Key (Basic) no rapidapi.com/apidojo/api/shazam/ e me manda na dm! hihihi',
                         'Botzinho está sem mais usos!\nSe quiser ajudar criando uma Key (Basic) no site rapidapi.com/apidojo/api/shazam/details e me mandar na dm... 👉👈',
                         'Não consigo procurar mais 🥺\nAcabaram os usos da API secundária, mas você pode me ajudar criando uma Key [Basic] no site rapidapi.com/apidojo/api/shazam/ e me mandar <3']);
        default:
            return pick(['Ta na mão $resultado',
                         'Creio que seja $resultado',
                         'Fontes me dizem q seja $resultado',
                         'Acredito que $resultado',
                         'Se pá que é $resultado',
                         'ui ui $resultado',
                         'Talvez seja $resultado',
                         'Achei essa aq pacero: $resultado',
                         '$resultado eu acho',
                         '$resultado 😳',
                         '$resultado 👉👈',
                         '$resultado 😎',
                         '✨ $resultado ✨',
                         '⚡️ $resultado ⚡️',
                         '🔥👀 $resultado']).replace('$resultado', resultado);
    }
}

setupTwitter();
