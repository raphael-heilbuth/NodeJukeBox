const mongoose = require('mongoose');
const { Artista, Musica } = require('./models');

mongoose.connect('mongodb://localhost/JukeBox', {useNewUrlParser: true});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => console.log("Conectado"));

function CountMusica(artista, musica) {
    Artista.findOne({'name': artista}, function (err, retornoArtista) {
        if (err) return console.log(err);
        if (retornoArtista === null) {
            const newArtista = new Artista({
                _id: new mongoose.Types.ObjectId(),
                name: artista,
                reproduzida: 1
            });

            newArtista.save(function (err) {
                if (err) return console.log(err);

                console.log('Artista %s salvo', artista);

                Musica.findOne({'title': musica}, function (err, retornoMusica) {
                    if (err) return console.log(err);

                    if (retornoMusica === null) {
                        const newMusica = new Musica({
                            title: musica,
                            reproduzida: 1,
                            artista: newArtista._id
                        });

                        newMusica.save(function (err) {
                            if (err) return console.log(err);
                            console.log("Musica %s salva", musica);
                        });
                    }
                });
            });
        } else {
            Artista.update({'name': artista}, {$inc: {reproduzida: 1}}).exec().then(r => console.log(r));

            Musica.findOne({'title': musica}, function (err, retornoMusica) {
                if (err) return console.log(err);

                if (retornoMusica === null) {
                    const newMusica = new Musica({
                        title: musica,
                        reproduzida: 1,
                        artista: retornoArtista._id
                    });

                    newMusica.save(function (err) {
                        if (err) return console.log(err);
                        console.log("Musica %s salva", musica);
                    });
                } else {
                    Musica.update({'title': musica}, {$inc: {reproduzida: 1}}).exec().then(r => console.log(r));
                }
            });
        }
    });
}


module.exports = { CountMusica }