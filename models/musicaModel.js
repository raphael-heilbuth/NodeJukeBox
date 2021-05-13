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
    },
    Musica: {
        type: String
    },
    Tipo: {
        type: String
    },
    Meta: {
        container: {
            type: String
        },
        codec: {
            type: String
        },
        duration: {
            type: Number
        }
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Musica', musicaModel);