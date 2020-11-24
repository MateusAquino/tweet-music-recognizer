const mongoose = require('../config/database');

const RecognitionsSchema = new mongoose.Schema({
    mediaURL: {
        type: String,
        unique: true,
        require: true
    },

    responseId: {
        type: String,
        required: true
    }
});

const Recognitions = mongoose.model('Recognitions', RecognitionsSchema);

module.exports = Recognitions;