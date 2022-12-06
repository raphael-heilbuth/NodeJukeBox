const musicFolder = (process.env.FOLDER_MUSIC || "/home/raphael/Downloads/MUSICAS VS PRODUTOS");
const {getRandomInteger, getBoolean} = require("../uteis/util");
const fs = require("fs");
const {RetornaListaMusicas, RetornaListaMetaData} = require("../uteis/lista");
const ParametrosController = require("./parametros");
let listaMusicasBanco = {},
    totalMusica = 0,
    musicasTocadas = 0,
    totalTocadas = 0,
    totalAlbum = 0;

class MusicasController {
    proxima(req, res) {
        res.status(200).json({'Sucesso': true});
        io.emit('proxima', 1);
    }

    selecionaMusica(req, res) {
        let musica = buscaMusica(req.body.Artista, req.body.Musica);

        res.status(200).json({'Sucesso': musica !== {}});
        io.emit('musica', musica);
    }

    listaArtistas(req, res) {
        res.status(200).json(retornaListaArtista());
    }

    listaMusicas(req, res) {
        res.status(200).json(retornaListaMusica(req.query.Artista));
    }

    topMusicas(req, res) {
        let top = [];
        db.RetornaTopMusicas(parseInt(req.query["Quantidade"].replace("Top", ""))).then((topMusicas) => {
            [...topMusicas].forEach(musica => {
                let musicas = listaMusicasBanco.find(a => a.name === musica["Artista"]["0"]["name"]).Musicas.find(b => b.title === musica["title"]),
                    item = {
                        'Artista': musica["Artista"]["0"]["name"],
                        'Musica': musicas["Musica"],
                        'Titulo': musicas["title"],
                        'Duracao': musicas["Meta"]["duration"],
                        'Tipo': musicas["Tipo"]
                    }

                top.push(item);
            });

            res.json(top);

        }).catch(() => res.json(top));
    }

    randomMusica(req, res) {
        let random = [];

        for (let i = 0; i < parseInt(req.query["Quantidade"].replace("Random", "")); i++) {
            let tentativa = 0,
                posArtista = getRandomInteger(listaMusicasBanco.length);

            do {
                let posMusicas = getRandomInteger(listaMusicasBanco[posArtista].Musicas.length),
                    artista = listaMusicasBanco[posArtista],
                    musica = artista.Musicas[posMusicas],
                        item = {
                            'Artista': artista.name,
                            'Musica': musica.Musica,
                            'Titulo': musica.title,
                            'Duracao': musica.Meta.duration,
                            'Tipo': musica.Tipo
                        };
                    if (artista["artista"]) {
                        random.push(item);
                    } else {
                        posArtista = getRandomInteger(listaMusicasBanco.length);
                        tentativa++;
                    }
            } while (!listaMusicasBanco[posArtista]["artista"] && tentativa < 10);
        }

        res.json(random);
    }

    playMusica(req, res) {
        let returnData = {},
            caminhoMusica = req.query.artista === 'Vários Artistas' ? musicFolder + '/' + req.query["musica"] : musicFolder + '/' + req.query.artista + '/' + req.query["musica"];

        fs.readFile(caminhoMusica, function (err, file) {
            if (err) {
                returnData.success = false;
            } else {
                if (!getBoolean((typeof req.query.random  === "undefined" ? false : req.query.random))) {
                    db.CountMusica(req.query.artista, req.query["musica"]).then(() => {
                        //
                    });
                }
                let base64File = new Buffer.from(file).toString('base64');

                returnData.success = true;
                returnData.fileContent = base64File;
            }
            res.json(returnData);
        });
    }

    getNewMusicas(req, res) {
        let listaMusicas = RetornaListaMusicas();

        db.RetornaMusicas().then((retornoMusicas) => {
            listaMusicasBanco = retornoMusicas;
            let listaPadraoMusicas = listaMusicasBanco.map(x => {
                {
                    return {
                        "Artista": x.name, "Musicas": x.Musicas.map(y => {
                            return y.title
                        })
                    }
                }
            });

            let difference = listaMusicas.filter(x => !listaPadraoMusicas.some(item => item.Artista === x.Artista));

            for (const artistas of listaMusicas) {
                if (difference.filter(x => x.Artista === artistas.Artista).length === 0) {
                    let musicas = artistas.Musicas.filter(x => !listaPadraoMusicas.find(y => y.Artista === artistas.Artista).Musicas.some(item => item === x));

                    if (musicas.length > 0) {
                        difference.push({"Artista": artistas.Artista, "Musicas": musicas});
                    }
                }
            }

            let listaNewMusicas = {
                'ListaMusica': difference,
                'TotalArtistas': difference.length,
                'TotalMusicas': difference.length > 0 ?difference.map(x => {
                    return x.Musicas
                }).reduce((a, b) => a.concat(b)).length : 0
            }

            res.json(listaNewMusicas);
        }).catch(() => { res.json([]); });
    }

    adicionaMusicasBanco(req, res) {
        if (Object.keys(req.body.novas).length > 0) {
            let nova = [];

            nova.push(req.body.novas);

            RetornaListaMetaData(nova).then(() => {
                db.RetornaMusicas()
                    .then(() => { res.json(true); })
                    .catch(() => { res.json(false); });
            })
        } else {
            res.json(false);
        }
    }

    getList(_req, res) {
        Promise.all([
            ParametrosController.retornaParametros(),
            db.MusicasTocadas(),
            db.TotalTocadas(),
            db.TotalMusicas(),
            db.TotalArtistas()
        ])
        .then((retornos) => {
            let parametros = retornos[0];

            musicasTocadas = retornos[1];
            totalTocadas = retornos[2];
            totalMusica = retornos[3];
            totalAlbum = retornos[4];

            listaMusicasBanco = listaMusicasBanco.map((x) => {
                x.Musicas.map(musica => {
                    musica["popularidadeGloba"] = ((100 / totalTocadas ?? 1) * musica.reproduzida);
                    musica["popularidadeArtista"] = ((100 / x.reproduzida ?? 1) * musica.reproduzida);
                });
                return Object.assign(x, {'popularidade': popularidadeArtista(x.reproduzida, totalTocadas),  'artista': true, 'formatos' : [...new Set(x.Musicas.map(item => item.Tipo))]})
            });

            if (parametros["youtubeMusicas"]) {
                listaMusicasBanco.push({"name": "Youtube", "artista": false, "Musicas": [{"Musica": "Pesquisar", "title": "Pesquisar", "Meta": null}]});
            }

            if (parametros["topMusicas"]) {
                listaMusicasBanco.push({"name": "TOP", "artista": false, "Musicas": [
                        {"Musica": "Top 10", "title": "10", "Meta": null},
                        {"Musica": "Top 20", "title": "20", "Meta": null},
                        {"Musica": "Top 30", "title": "30", "Meta": null},
                        {"Musica": "Top 40", "title": "40", "Meta": null},
                        {"Musica": "Top 50", "title": "50", "Meta": null},
                        {"Musica": "Top 100", "title": "100", "Meta": null}
                    ]});
            }

            if (parametros["randomMusicas"]) {
                listaMusicasBanco.push({"name": "Random", "artista": false, "Musicas": [
                        {"Musica": "Random 1", "title": "1", "Meta": null},
                        {"Musica": "Random 3", "title": "3", "Meta": null},
                        {"Musica": "Random 5", "title": "5", "Meta": null},
                        {"Musica": "Random 10", "title": "10", "Meta": null}
                    ]});
            }

            listaMusicasBanco = listaMusicasBanco.sort(function(a,b) {
                return a.name.localeCompare(b.name);
            });

            let lista = {
                'ListaMusica': listaMusicasBanco,
                'TotalMusicas': totalMusica,
                'MusicasTocas': musicasTocadas,
                'TotalAlbum': totalAlbum,
                'Parametros': parametros
            }

            res.json(lista);
        })
        .catch(function erro (rej) { console.error(rej) })
    }

    retornaDadosDashboard() {
        return {
            'TotalMusicas': totalMusica,
            'MusicasTocadas': musicasTocadas,
            'TotalTocadas': totalTocadas
        }
    }
}

function popularidadeArtista(tocadas, total) {
    return (total > 0 ? (100 / total) * tocadas : 0);
}

function retornaListaArtista() {
    if (listaMusicasBanco.length > 0) {
        return listaMusicasBanco.map(x => {
            return {'Artista': x.name, 'Capa': 'public/image/capas/' + x.name + '.jpg'};
        });
    } else {
        return {};
    }
}

function retornaListaMusica(artista) {
    if (listaMusicasBanco.length > 0) {
        return listaMusicasBanco.find(a => a.name === artista).Musicas.map(x => {
            return {
                'NomeMusica': x["title"],
                'Duracao': x["Meta"]["duration"]
            }
        });
    } else {
        return {};
    }
}

function buscaMusica(artista, musica) {
    if (listaMusicasBanco.length > 0) {
        let musicas = listaMusicasBanco.find(a => a.name === artista).Musicas.find(x => x.title === musica);

        if (musica) {
            return {
                'Artista': artista,
                'Musica': musicas["Musica"],
                'Titulo': musicas["title"],
                'Duracao': musicas["Meta"]["duration"],
                'Tipo': musicas["Tipo"]
            }
        } else {
            return {};
        }
    } else {
        return {};
    }
}

module.exports = new MusicasController();
