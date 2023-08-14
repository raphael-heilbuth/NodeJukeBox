const mongoose = require('mongoose');

const artistaModel = mongoose.Schema({
    name: {
        type: String,
        required: '{PATH} is required!'
    },
    reproduzida: {
        type: Number
    },
    random: {
        type: Number
    },
    Musicas: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'musica' }
    ]
}, {
    timestamps: true
});

module.exports = mongoose.model('Artista', artistaModel);
