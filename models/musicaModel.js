const mongoose = require('mongoose');

const musicaModel = mongoose.Schema({
    title: {
        type: String,
        required: '{PATH} is required!'
    },
    reproduzida: {
        type: Number
    },
    artista: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Artista'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Musica', musicaModel);