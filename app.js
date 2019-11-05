require('dotenv').config();
var app = require('./config/server.js'); 
var tvd = require('twitter-video-downloader');
var cliente;

//Configura a porta disponível ou a porta 3000
var server_port = process.env.YOUR_PORT || process.env.PORT || 3000;
//Configura o host disponível ou "0.0.0.0"
var server_host = process.env.YOUR_HOST || '0.0.0.0';

app.listen(server_port, server_host, function () {
    console.log("Aplicação online.");
});

app.get("/", function (req, res) {
    res.send("A aplicação está online.");
});

function setupTwitter() {
    cliente = require('./config/twitter.js');
    cliente.stream('statuses/filter', {track: '@nomemusica'}, function(stream) {
        stream.on('data', function(event) {
            let tweet = event.in_reply_to_status_id_str;
            let username = event.user.name;
            console.dir(event);
        });
   
        stream.on('error', function(error) {
        throw error;
        });
    });

    let test = '1190400609347764224';
    cliente.get('statuses/lookup', {id: test}, function(error, tweet, event){
        let mediaURL = tweet[0].entities.media[0].expanded_url.replace(/\/video\/1$/,'');
        console.log('Identificando musica: '+mediaURL);
        // tvd(mediaURL)
        //     .then(function(videoReadableBufferStream) {
        //         // DO SOMETHING WITH MP4 FORMATTED VIDEO
        //         console.dir(videoReadableBufferStream);
        //     }
        // );
        tvd('https://twitter.com/GIPHY/status/836063152542482434')
  .then(function(videoReadableBufferStream) {
    // DO SOMETHING WITH MP4 FORMATTED VIDEO
  }
);
    });
}

function setupAudD(){
    var request = require("request");

    var data = {
        'url': 'https://audd.tech/example1.mp3',
        'return': 'timecode,apple_music,deezer,spotify',
        'api_token': 'test'
    };
    
    request({
        uri: 'https://api.audd.io/',
        form: data,
        method: 'POST'
      }, function (err, res, body) {
        console.log(body);
    });
}

setupTwitter();
//setupAudD();