var bodyParser = require('body-parser')
var urlencodedParser = bodyParser.urlencoded({ extended: false })

var express = require("express");
var app = express();

app.use(urlencodedParser);

app.set('trust proxy', 1);
app.engine('html', require('ejs').renderFile);

module.exports = app;