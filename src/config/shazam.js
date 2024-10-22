const Config = require('../controllers/Config');
const ffmpeg = require('fluent-ffmpeg');
const axios = require("axios");
const fs = require('fs');

class Shazam {
	constructor(token) {
		this.token = token;
	}

	convertToRAWbase64(filename, fileraw, resolve, reject) {
		ffmpeg(filename)
			.inputOptions([
				'-sseof', '-8s'
			])
			.output(fileraw)
			.outputOptions([
				'-t', '5s',
	  			'-acodec', 'pcm_s16le',
	  			'-f', 's16le',
	  			'-ac', '1',
	  			'-ar', '44100'
	  		])
			.on('error', function(err) {
				console.error('An error occurred (FFMPEG): ' + err.message);
				reject();
			})
			.on('end', async function() {
				console.log('[Shazam] Processing finished!');
				const data = await fs.readFileSync(fileraw).toString('base64');
				resolve(data);
	  		})
		.run();
	}

	search(rawBase64, token, resolve) {
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
	  	.then(response=>{
			if (response.data && response.data.track) { // Musica encontrada
	  	  		const {title, subtitle} = response.data.track;
				resolve(subtitle + ' - ' + title);
			} else if (response.data) { // Musica não encontrada
				resolve('404')  
	  		} else {
				console.error('Unexpected error from Shazam API')
				resolve('599') // Outro erro
	  		} 
	  	})
	  	.catch(async error => {
			console.error('API Key failed:')
			if (error.response && error.response.data) {
				const msg = error.response.data.message || JSON.stringify(error.response.data);
				console.error(msg);
	  			if (msg && msg.includes('MONTHLY quota')) {
					try {
						const config = await Config.getConfig();
						let keyArray = [];
						let first = false;
						// Mover ratelimit'ed key pro final da lista
						config.rapidapi_shazam_key.split('\n').forEach(key => {
							if (parseInt(key.split(/, */)[1])!==500) {
								if (!first) first = key
								else keyArray.push(key)
							} else 
								keyArray.push(key)
						})
						keyArray.push(first);
						config.rapidapi_shazam_key = keyArray.join('\n');
						await Config.setConfigs(config);
					} catch (err) {
						console.error(err);
					}

					resolve('405'); // Limite da API alcançado
				} else 
					resolve('404'); // API offline
	  		}
	  	});
	}

	async identify(filename, fileraw) {
		try {
			return new Promise((resolve, reject)=>{
				try {
					this.convertToRAWbase64(filename, 
										   fileraw, 
										   data64 => this.search(data64, this.token, resolve, reject));
				} catch (err) {
					reject('404');
				}
			})
		} catch (err) {
			return '404'
		}
	}
}

const load = async () => {
	const key = await Config.get('rapidapi_shazam_key');
	if (!key) return false;

	return new Shazam(key[0]);
}

module.exports.load = load;
