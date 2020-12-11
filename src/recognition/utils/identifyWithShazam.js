identifyTempMp4Shazam = async tempFile => {
    const shazam = await require('../../config/shazam').load();
    if (!shazam) {console.log('Warning: Shazam API Limit reached!'); return false};

    const songName = await shazam.identify(tempFile.path, tempFile.pathRaw);
    return songName &&
           songName !== '599' &&
           songName !== '404' && 
           songName !== '405' ? songName : false;
}

module.exports = identifyTempMp4Shazam;