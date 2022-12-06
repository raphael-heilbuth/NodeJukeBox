const mm = require('music-metadata');
const fs = require('fs');
const path = require('path');

const musicFolder = (process.env.FOLDER_MUSIC || "/home/raphael/Downloads/MUSICAS VS PRODUTOS");

function GeraCapas(dir, file) {
    let diretorios = dir.split('/'),
        artista = diretorios[diretorios.length - 1];
    if (!fs.existsSync('public/image/capas/' + artista + '.jpg')) {
        fs.copyFile(dir + "/" + file, 'public/image/capas/' + artista + '.jpg', (err) => {
            if (err) {
                console.log(err)
            }
        });
    }
}

function AdicionaMusicaLista(file, dir, artistasArquivos) {
    if (path.extname(file).toLowerCase() === '.mp3' || path.extname(file).toLowerCase() === '.mp4') {
        if (dir === musicFolder) {
            let existeArtista = artistasArquivos.find(x => x.Artista === 'Vários Artistas');
            if (typeof existeArtista === "undefined") {
                artistasArquivos.push({"Artista": 'Vários Artistas', "Musicas": [file]});
            } else {
                existeArtista.Musicas.push(file);
            }
        } else {
            artistasArquivos.push(file);
        }
    }
}

exports.RetornaListaMusicas = function RetornaMusicas() {
    function readDir(dir) {
        let artistasArquivos = [];

        if (!fs.existsSync('public/image/capas')){
            fs.mkdirSync('public/image/capas');
        }

        fs
            .readdirSync(dir)
            .forEach(file => {
                if (fs.lstatSync(dir + "/" + file).isFile()) {
                    if (path.extname(file).toLowerCase() === '.jpg' || path.extname(file).toLowerCase() === '.jpeg') {
                        GeraCapas(dir, file);
                    } else {
                        AdicionaMusicaLista(file, dir, artistasArquivos);
                    }
                } else if (fs.lstatSync(dir + "/" + file).isDirectory()) {
                    artistasArquivos.push({"Artista": file, "Musicas": readDir(dir + "/" + file)});
                }

            })

        return artistasArquivos

    }

    return readDir(musicFolder);
}

exports.RetornaListaMetaData = async function RetornaListaMetaData(lista) {
    for (const artista of lista) {
        for (const musica of artista.Musicas) {
            if (musica.toLowerCase().includes('.mp3') || musica.toLowerCase().includes('.mp4')) {
                let caminhoMusica = (artista.Artista === 'Vários Artistas') ? musicFolder + "/" + musica : musicFolder + "/" + artista.Artista + "/" + musica;
                await RetornaMetaData(caminhoMusica)
                    .then(async (meta) => {
                        let objMusica = {
                            'Musica': musica.slice(0, -4),
                            'Tipo': path.extname(musica),
                            'Meta': {container: meta.format.container, codec: meta.format.codec, duration: meta.format.duration}
                        };

                        await db.SalvaMusica(artista.Artista, musica, objMusica).then(() => {
                        });
                    })
                    .catch(err => {
                        console.log(err)
                    });
            }
        }
    }
    return true;
}

const RetornaMetaData = (file) => new Promise((success, reject) => {
    mm.parseFile(file,{skipCovers : true})
        .then(metadata => {
            success(metadata);
        })
        .catch(err => {
            console.error(err.message)
            reject(err);
        });
});
