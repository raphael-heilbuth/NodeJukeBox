const mongoose = require('mongoose');

const parametrosModel = mongoose.Schema({
    _id: Number,
    modo: {
        type: String,
        enum: ['Livre', 'Ficha'],
        required: '{PATH} é requerido'
    },
    valorCredito: {
        type: Number,
        default: 0.50
    },
    topMusicas: {
        type: Boolean,
        default: true
    },
    randomMusicas: {
        type: Boolean,
        default: true
    },
    youtubeMusicas: {
        type: Boolean,
        default: true
    },
    timeRandom: {
        type: Number,
        default: 240000
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Parametros', parametrosModel);