require('dotenv').config();

if (process.env.databaseuri === "mongodb+srv://AAA:BBB@CCC.DDD.mongodb.net/example") {
    console.log("Warning! This script won't run properly without tokens and keys (Twitter, ACR & Youtube Data).");
    console.log("Please set them up in your .env file before running (Check README.md)")
    return;
}

const app = require('./src/config/server.js');
const routes = require('./src/routes');

app.use(routes);

app.listen(process.env.PORT || 3000);

const Administration = require('./src/controllers/Administration.js');
const defLog = console.log, defErr = console.error;

console.error = log => Administration.addLog(log, defErr, true)
console.log = console.warn = console.info = log => Administration.addLog(log, defLog);


require('./src/recognition/index')();