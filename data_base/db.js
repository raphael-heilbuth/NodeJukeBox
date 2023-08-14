const mongoose = require('mongoose');
const { Artista, Musica, Parametros } = require('../models');

mongoose.set('strictQuery', false);
mongoose.connect('mongodb://127.0.0.1:27017/JukeBox', {useNewUrlParser: true, useUnifiedTopology: true})
    .then(() => {
        console.log("Conectado")
    })
    .catch((error) => {
        console.log(error);
    })

function SalvaMusicasBD(musica, newArtista, dadosMusica, success, reject) {
    Musica.findOne({'title': musica, 'artista': newArtista._id}, function (err, retornoMusica) {
        if (retornoMusica === null) {
            const newMusica = retornaMusica(musica, newArtista._id, dadosMusica);

            newMusica.save()
                .then(() => {
                    console.log("Musica %s salva", musica);
                    if (!newArtista.genero) {
                        AdicionaGeneroArtista(newArtista, musica.Meta.genero)
                            .then(() => success(true))
                            .catch((err) => {console.log(err); success(true)});
                    } else {
                        success(true);
                    }
                }).catch((err) => {
                    reject(err);
                    return console.log(err);
            })
        }
    });
}

const AdicionaGeneroArtista = (artista, genero) => new Promise((success, reject) => {
    artista.updateOne({ _id: artista._id }, {
        genero: genero
    }).then(() => {
        success(true);
    }).catch((err) => {
        reject(err);
    })
})

const SalvaMusica = (artista, musica, dadosMusica) => new Promise((success, reject) => {
    Artista.findOne({'name': artista}, function (err, retornoArtista) {
        if (err) { reject(err); return console.log(err); }
        if (retornoArtista === null) {
            const newArtista = new Artista({
                _id: new mongoose.Types.ObjectId(),
                name: artista,
                reproduzida: 0
            });

            newArtista.save()
                .then(() => {
                    console.log('Artista %s salvo', artista);
                    SalvaMusicasBD(musica, newArtista, dadosMusica, success, reject);
            }).catch((err) => {
                reject(err);
                return console.log(err);
            })
        } else {
            SalvaMusicasBD(musica, retornoArtista, dadosMusica, success, reject);
        }
    });
});

const CountMusica = (artista, musica, random = false) => new Promise(() => {
    Artista.findOne({'name': artista}, function (err, retornoArtista) {
        let update = (random ? {$inc: {random: 1}} : {$inc: {reproduzida: 1}});
        if (err) return console.log(err);
        if (retornoArtista !== null) {
            Artista.updateOne({'_id': retornoArtista._id}, update).exec().then(r => console.log(r));
            Musica.updateOne({'title': musica, 'artista': retornoArtista._id}, update).exec().then(r => console.log(r));
        }
    });
});

const TotalTocadas = () => new Promise((success) => {
   Artista.aggregate([
       { $group: {
               _id: null,
               total: { $sum: "$reproduzida"}
           }}]).exec().then(r => {
                success(r.length > 0 ? r["0"].total : 0)
           })
       .catch(() => success(0));
});

const TotalRandom = () => new Promise((success) => {
    Artista.aggregate([
        { $group: {
                _id: null,
                total: { $sum: "$random"}
            }}]).exec().then(r => {
        success(r.length > 0 ? r["0"].total : 0)
    })
        .catch(() => success(0));
});

const PopularidadeArtista = (artista) => new Promise((success) => {
    Artista.findOne({'name': artista}).then(r => success(r !== null ? r["reproduzida"] : 0));
});

const PopularidadeMusica = (artista, musica) => new Promise((success) => {
    Artista.findOne({'name': artista}).then(artista => {
        if (artista === null) {
            success(0);
        } else {
            Musica.findOne({
                'title': musica,
                'artista': artista._id
            }).then(r => success(r !== null ? r["reproduzida"] : 0));
        }
    });
});

const RetornaMusicas = () => new Promise((success) => {
    Artista.aggregate([
        {
            '$sort': {
                'name': 1
            }
        }, {
            '$lookup': {
                'from': 'musicas',
                'localField': '_id',
                'foreignField': 'artista',
                'pipeline': [
                    {
                        '$sort': {
                            'Musica': 1
                        }
                    }
                ],
                'as': 'Musicas'
            }
        }
    ]).exec().then(r => success(r));
});

const RetornaTopMusicas = (qtd) => new Promise((success) => {
    Musica.aggregate([{ '$lookup': {
            'from': 'artistas',
            'localField': 'artista',
            'foreignField': '_id',
            'as': 'Artista'
        }}]).sort({'reproduzida': -1}).limit(qtd).exec().then(r => success(r));
});

const MusicasTocadas = () => new Promise((success) => {
    Musica.countDocuments({reproduzida: {$gt: 0}}, function(err, count){
        success(count);
    });
});

const TotalArtistas = () => new Promise((success) => {
    Artista.countDocuments({}, function( err, count){
        success(count);
    });
});

const TotalMusicas = () => new Promise((success) => {
    Musica.countDocuments({}, function( err, count){
        success(count);
    });
});

const SalvaParametros = (modo, valorCredito, topMusicas, randomMusicas, youtubeMusicas, timeRandom) => new Promise((success, reject) => {
    const newParametros = new Parametros({
        _id: 1,
        modo: modo,
        valorCredito: valorCredito,
        topMusicas: topMusicas,
        randomMusicas: randomMusicas,
        youtubeMusicas: youtubeMusicas,
        timeRandom: timeRandom
    });

    if (newParametros["errors"] !== undefined) {
        reject(newParametros["errors"])
        return false;
    }

    Parametros.updateOne({
        _id: 1
    }, newParametros, {upsert: true, setDefaultsOnInsert: true, runValidators: true}, function(err, res) {
        if (err) {
            reject(err)
            return false;
        }
        console.log(res);
        success(res);
    });
});

const RetornaParametros = () => new Promise((success) => {
    Parametros.findOne({'_id': 1}).then(r => success(r));
});

function retornaMusica(musica, newArtista, dados) {
    return new Musica({
        title: musica,
        reproduzida: 0,
        artista: newArtista,
        Musica: dados.Musica,
        Tipo: dados.Tipo,
        Meta: {
            container: dados.Meta.container,
            codec: dados.Meta.codec,
            duration: dados.Meta.duration
        }
    });
}

module.exports = {
    TotalArtistas,
    TotalMusicas,
    TotalRandom,
    TotalTocadas,
    PopularidadeArtista,
    PopularidadeMusica,
    SalvaMusica,
    RetornaTopMusicas,
    MusicasTocadas,
    SalvaParametros,
    RetornaParametros,
    RetornaMusicas,
    CountMusica
}
