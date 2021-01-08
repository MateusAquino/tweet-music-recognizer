identifyTempMp4ACR = async tempFile => {
    const acr = await require('../../config/acr').load();
    if (!acr) {
        console.error('Warning: ACR API Limit reached!'); 
        return '405';
    }
    try {
        const metadata = await acr.identify(tempFile.sample);

        const statusMsg = metadata.status.msg;
        if (statusMsg !== 'Success')
            return false;
    
        const song = metadata['metadata']['music'];
        let songName = '';
        for (let s of song[0].artists)
            songName += s.name + ", ";
        songName = (songName ? songName.slice(0, -2).replace(';', ', ') : 'Artista Desconhecido') + ' - ' + song[0].title;
        return songName;
    } catch (err) {
        console.error('Unexpected error from ACR API');
        console.error(err)
        return false;
    }
}

module.exports = identifyTempMp4ACR;