var fs = require('fs');
var axios = require("axios");
var ffmpeg = require('fluent-ffmpeg');
var tokens = process.env.rapidapi_shazam_key.split(/, ?/);
var utcmonth = new Date().getUTCMonth();

function convertToRAWbase64(filename, cb) {
    const rawfilename = filename.split('mp4')[0]+'raw';
    ffmpeg(filename)
        .output(rawfilename)
        .outputOptions([
  	        '-acodec', 'pcm_s16le',
  	        '-f', 's16le',
  	        '-ac', '1',
  	        '-ar', '44100'
  	    ])
        .duration(5)
        .on('error', function(err) {
            console.log('An error occurred (FFMPEG): ' + err.message);
        })
        .on('end', async function() {
            console.log('Processing finished!');
            var fs = require('fs');
            const data = await fs.readFileSync(rawfilename).toString('base64');
            fs.unlinkSync(rawfilename)
            cb(data);
  	    })
    .run();
}

function identify(rawBase64, token, callback){
  	axios({
  		    "method":"POST",
  		    "url":"https://shazam.p.rapidapi.com/songs/detect",
  		    "headers":{
      		    "content-type": "text/plain",
  		        "x-rapidapi-host": "shazam.p.rapidapi.com",
  		        "x-rapidapi-key": token,
  		        "useQueryString": true
            },
            "data": rawBase64
  		})
  		.then((response)=>{
  			if (response.data && response.data.track) { // Musica encontrada
  		  		const {title, subtitle} = response.data.track;
                console.log(subtitle + ' - ' + title)
                callback(subtitle + ' - ' + title);
  			} else if (response.data) { // Musica não encontrada
                callback('404')  
  			} else { // Outro erro
                console.log('Unexpected error from Shazam API')
                callback('404')  // 404 pois não há outra msg a mandar ao usuario
  			} 
  		})
  		.catch((error)=>{
  			if (error.response && error.response.data) {
  				const msg = error.response.data.message;
  				if (msg.includes('this API') || msg.includes('limit')) { 
                    console.log('API Key failed')
                    callback('405'); // Limite da API alcançado
                } else 
                    callback('404'); // API offline
  			}
  		});
}

module.exports = function (filename, cb) {
    // Obtem dados no formato "mes:qntUsos"
    fs.readFile('usesPerMonth', 'utf8', function(err, data) {
        const monthUses = data.split(":");
        var newUses;
        if (utcmonth === parseInt(monthUses[0]))
            newUses = parseInt(monthUses[1])+1;
        else
            newUses = 1;

        // Salva dados no formato "dia:qntUsos" (+1)
        fs.writeFile('usesPerMonth', `${utcmonth}:${newUses}`, ()=>{
            keyNum = Math.floor((newUses-1)/500);
            keyNum = keyNum >= tokens.length ? 0 : keyNum;
            const currentToken = tokens[keyNum];
            convertToRAWbase64(filename, data64 => {
                identify(data64, currentToken, cb);
            })
        }); 
    });
};