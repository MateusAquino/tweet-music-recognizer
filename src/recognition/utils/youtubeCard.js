const youtube = require('youtube-api-v3-search');
const Config = require('../../controllers/Config');

const youtubeSearch = async query => {
    const search = await youtube(await Config.get('youtube_access_token'), {
        q: query,
        part: 'snippet',
        type: 'video'
    });
    if (search && search['items'] && search['items'][0])
        return search['items'][0]['id']['videoId'];
    else 
        return '404';
}

const searchCard = async songName => {
    console.log(`Searching yt ID for: '${songName}'`);
    try {
        const search = await youtubeSearch(songName);
        console.log(search!=='404' ? `Found: '${search}'`         : `Youtube video ID not found!` );
        return      search!=='404' ? `https://youtu.be/${search}` : false;
    } catch (err) {
        console.log('EXCEPTION: ' + err);
        return false;
    }
}

module.exports = searchCard;