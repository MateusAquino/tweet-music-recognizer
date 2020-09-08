# tweet-music-recognizer ![CI](https://github.com/MateusAquino/tweet-music-recognizer/workflows/CI/badge.svg) [![Heroku](http://heroku-shields.herokuapp.com/tweet-music-recognizer)](https://tweet-music-recognizer.herokuapp.com)
Node.js Bot to identify songs in Twitter videos!  
Audio Recognition provided by [ACRCloud](https://www.acrcloud.com/).  
Mention [@nomemusica](https://twitter.com/nomemusica) (pt-BR) to a music video for a live preview.

## 🚀 Setup
To run this bot you'll need to insert some tokens inside the `.env` file.

### ACRCloud API
This API is responsible for the fingerprinting, it'll receive the .mp4 video and try to extract information about the song in background.
After creating your account, access the [ACRCloud Console](https://us-console.acrcloud.com/service/avr) and grab the `Host`, `Access Key` and `Access Secret` for your application.  
If you intend to use more than a single ACR API Key/Secret to increase the usages per day (*100rq/day*), separate them with a comma inside the `.env` file.

### Youtube Data API v3
You'll need to create a Google API Project for that (don't worry, it's free). After creating your project, head to your [Google API Console](https://console.developers.google.com) and enable `Youtube Data API v3`, generate your [`API Key`](https://console.developers.google.com/apis/credentials) and you're good to go.

### Twitter API
If you don't have your own Twitter App yet, I suggest creating it directly into your bot account, as **all four tokens** will be easily found in your [Apps' page](https://developer.twitter.com/en/apps/). However, if you already have one, grab your `Consumer API Key` and `Consumer API Secret`, add them to your `.env` file, also use them on [Twurl](https://developer.twitter.com/en/docs/tutorials/using-twurl) to generate your `Access Token Key` and `Access Token Secret` for separate bot accounts (they'll be saved in `~/.twurlrc`).

### Shazam API (optional)
This is an **optional** fallback API, just in case ACRCloud fails to match in the first time. You can also use more than a single token to increase the usages per month (*500rq/month*).  
To acquire your RapidAPI token, add a new app and subscribe it to [apidojo's Shazam](https://rapidapi.com/apidojo/api/shazam), then copy your `X-RapidAPI-Key` and the setup is over.

## ✨ Run
You can upload this project to Heroku if you want, but to test it in your own machine, simply execute:

```bash
npm install # once only
npm start
```

## 📜 License

[MIT](./LICENSE) &copy; [Mateus Aquino](https://www.linkedin.com/in/mateusaquino/)
