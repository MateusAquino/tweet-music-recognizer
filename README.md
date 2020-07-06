# tweet-music-recognizer
Node.js Bot to identify songs in Twitter videos!  
Audio Recognition provided by [ACRCloud](https://www.acrcloud.com/).

## Setup
To run this bot you'll need to insert some tokens inside the `.env` file.

### ACRCloud API
This API is responsible for the fingerprinting, it'll receive the .mp4 vídeo and try to extract information about the songs in background.
After creating your account, access the [ACRCloud Console](https://us-console.acrcloud.com/service/avr) and grab the `Host`, `Access Key` and `Access Secret` for your application.

### Youtube Data API v3
You'll need to create a Google API Project for that (don't worry, it's free). After creating your project, head to your [Google API Console](https://console.developers.google.com) and enable `Youtube Data API v3`, generate your [`API Key`](https://console.developers.google.com/apis/credentials) and you're good to go.

### Twitter API
If you don't have your own Twitter App yet, I suggest creating it directly into your bot account, as **all four tokens** will be easily found in your [Apps page](https://developer.twitter.com/en/apps/). However, if you already have one, grab your `Consumer API Key` and `Consumer API Secret`, add them to your `.env` file, also use them with [Twurl](https://developer.twitter.com/en/docs/tutorials/using-twurl) to generate your `Access Token Key` and `Access Token Secret` for other accounts (they'll be saved in `~/.twurlrc`).

## Run
You can upload this project to Heroku if you want, but to test it in your own machine, simply execute:

    npm install # once only
    npm app

## License

[MIT](./LICENSE) &copy; [Mateus Aquino](https://www.linkedin.com/in/mateusaquino/)