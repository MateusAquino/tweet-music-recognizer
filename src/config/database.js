const mongoose = require('mongoose');

mongoose.set('useCreateIndex', true);
mongoose.connect(process.env.databaseuri, { useNewUrlParser:true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;

module.exports = mongoose;