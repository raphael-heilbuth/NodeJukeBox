const dotenv = require('dotenv');
dotenv.config();
//
const express = require('express')
const app = express();
const http = require('http').Server(app);
global.io = require('socket.io')(http);
const mm = require('music-metadata');
const musicFolder = (process.env.FOLDER_MUSIC || "/home/raphael/Downloads/MUSICAS VS PRODUTOS");
const ytdl = require('ytdl-core');
const youtubeSearch = require('youtube-sr');
const fs = require('fs');
const path = require('path');
const abrirNavegador = require('open');
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('./swagger_output.json')

let listaMusicasBanco = {},
    totalMusica = 0,
    musicasTocadas = 0,
    totalTocadas = 0,
    totalAlbum = 0;

global.db = require('./db');

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/'));

app.use(require('./rotas'));

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerFile))

http.listen(8000, function () {
    console.log('Rodando na porta 8000')
});


app.get("/getNewMusicas", async function (_req, res) {
    let listaMusicas = RetornaMusicas();

    listaMusicasBanco = await global.db.RetornaMusicas();

    let teste = listaMusicasBanco.map(x => {
        {
            return {
                "Artista": x.name, "Musicas": x.Musicas.map(y => {
                    return y.title
                })
            }
        }
    });

    let difference = listaMusicas.filter(x => !teste.some(item => item.Artista === x.Artista));

    for (const artistas of listaMusicas) {
        if (difference.filter(x => x.Artista === artistas.Artista).length === 0) {
            let musicas = artistas.Musicas.filter(x => !teste.find(y => y.Artista === artistas.Artista).Musicas.some(item => item === x));

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

});

app.get("/addMusicasBanco", async function (_req, res) {
    if (_req.query.novas.length > 0) {
        await RetornaListaMetaData(_req.query.novas);

        listaMusicasBanco = await global.db.RetornaMusicas();
        res.json(true);
    }
});

app.get("/getList", async function (_req, res) {
    let parametros = await retornaParametros();

    musicasTocadas = await global.db.MusicasTocadas();
    totalTocadas = await global.db.TotalTocadas();
    totalMusica = await global.db.TotalMusicas();
    totalAlbum = await global.db.TotalArtistas();

    listaMusicasBanco = listaMusicasBanco.map((x) => {return Object.assign(x, {'formatos' : [...new Set(x.Musicas.map(item => item.Tipo))]})});

    if (parametros["youtubeMusicas"]) {
        listaMusicasBanco.push({"name": "Youtube", "Musicas": [{"Musica": "Pesquisar", "title": "Pesquisar", "Meta": null}]});
    }

    if (parametros["topMusicas"]) {
        listaMusicasBanco.push({"name": "TOP", "Musicas": [
            {"Musica": "Top 10", "title": "10", "Meta": null},
            {"Musica": "Top 20", "title": "20", "Meta": null},
            {"Musica": "Top 30", "title": "30", "Meta": null},
            {"Musica": "Top 40", "title": "40", "Meta": null},
            {"Musica": "Top 50", "title": "50", "Meta": null},
            {"Musica": "Top 100", "title": "100", "Meta": null}
        ]});
    }

    if (parametros["randomMusicas"]) {
        listaMusicasBanco.push({"name": "Random", "Musicas": [
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
});

app.get("/playMusic", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para enviar música pra tocar'
    /* #swagger.parameters['artista'] = {
          description: 'Nome do artista da música',
          type: 'string'
   } */
    /* #swagger.parameters['musica'] = {
          description: 'Nome do música',
          type: 'string'
   } */

    let returnData = {};

    fs.readFile(musicFolder + '/' + req.query.artista + '/' + req.query.musica, function (err, file) {
        if (err) {
            returnData.success = false;
        } else {
            if (!getBoolean((typeof req.query.random  === "undefined" ? false : req.query.random))) {
                global.db.CountMusica(req.query.artista, req.query.musica);
            }
            let base64File = new Buffer.from(file, 'binary').toString('base64');

            returnData.success = true;
            returnData.fileContent = base64File;
        }
        res.json(returnData);
    });
});

app.get("/tocaYoutube", function (req, res) {
    // #swagger.tags = ['Youtube']
    // #swagger.description = 'Endpoint para enviar para o site música do youtube a ser tocada'

    ytdl(req.query.IdMusica, {highWaterMark: 1 << 25}).pipe(res);
});

app.get("/buscaYoutube", function (req, res) {
    // #swagger.tags = ['Youtube']
    // #swagger.description = 'Endpoint para retornar as primeiras 5 músicas da pesquisa'
    /* #swagger.parameters['busca'] = {
          description: 'Música a ser buscada',
          type: 'string'
   } */

    retornaMusicaYoutube(req.query.busca)
        .then(listaYoutube => {
            res.json(listaYoutube);
        })
});

app.get("/randomMusica", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para retornar músicas aleatórias'
    /* #swagger.parameters['Quantidade'] = {
          description: 'Quantidade de músicas a serem buscadas',
          type: 'string'
   } */

    let random = [];

    for (let i = 0; i < parseInt(req.query.Quantidade.replace("Random", "")); i++) {
        let posArtista = getRandomInteger(listaMusicasBanco.length),
            posMusicas = getRandomInteger(listaMusicasBanco[posArtista].Musicas.length),
            artista = listaMusicasBanco[posArtista],
            musica = artista.Musicas[posMusicas],
            item = {
                'Artista': artista.name,
                'Musica': musica.Musica,
                'Titulo': musica.title,
                'Duracao': musica.Meta.duration,
                'Tipo': musica.Tipo
            }

        random.push(item);
    }

    res.json(random);
});

app.get("/topMusica", async function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para retornar a quantidade de músicas mais tocadas'
    /* #swagger.parameters['Quantidade'] = {
          description: 'Quantidade de músicas a serem buscadas',
          type: 'string'
   } */

    let top = [],
        arrayTop = await global.db.RetornaTopMusicas(parseInt(req.query.Quantidade.replace("Top", "")));

    Array.from(arrayTop).forEach(el => {
        let musicas = listaMusicasBanco.find(a => a.name === el["Artista"]["0"]["name"]).Musicas.find(b => b.title === el["title"]),
            item = {
                'Artista': el["Artista"]["0"]["name"],
                'Musica': musicas["Musica"],
                'Titulo': musicas["title"],
                'Duracao': musicas["Meta"]["duration"],
                'Tipo': musicas["Tipo"]
            }

        top.push(item);
    });

    res.json(top);
});

function RetornaMusicas() {    
    function readDir(dir) {
        let artistasArquivos = [];

        fs
            .readdirSync(dir)
            .forEach(file => {
                if (fs.lstatSync(dir + "/" + file).isFile()) {
                    if (path.extname(file).toLowerCase() === '.jpg' || path.extname(file).toLowerCase() === '.jpeg') {
                        let diretorios = dir.split('/'),
                            artista = diretorios[diretorios.length - 1];
                        fs.copyFile(dir + "/" + file, 'public/image/capas/' + artista + '.jpg', (err) => {
                            if (err) throw err;
                        });
                    } else {
                        if (path.extname(file).toLowerCase() === '.mp3' || path.extname(file).toLowerCase() === '.mp4') {
                            artistasArquivos.push(file);
                        }
                    }
                } else if (fs.lstatSync(dir + "/" + file).isDirectory()) {
                    artistasArquivos.push({"Artista": file, "Musicas": readDir(dir + "/" + file)});
                }

            })

        return artistasArquivos

    }

    return readDir(musicFolder);
}

async function retornaParametros() {
    let parametros = await global.db.RetornaParametros();

    if (parametros === null) {
        parametros = {
            modo: 'Ficha',
            valorCredito: 0.50,
            topMusicas: true,
            randomMusicas: true,
            youtubeMusicas: true,
            timeRandom: 240000
        }
    }

    return parametros;
}

function getBoolean(value){
    switch(value){
        case true:
        case "true":
        case 1:
        case "1":
        case "on":
        case "yes":
            return true;
        default:
            return false;
    }
}

async function RetornaListaMetaData(lista)  {
    for (const artista of lista) { 
        for (const musica of artista.Musicas) {             
            if (musica.toLowerCase().includes('.mp3') || musica.toLowerCase().includes('.mp4')) {
                await RetornaMetaData(musicFolder + "/" + artista.Artista + "/" + musica)
                    .then(async (meta) => {
                            let objMusica = {
                                'Musica': musica.slice(0, -4),
                                'Tipo': path.extname(musica),
                                'Meta': { container: meta.format.container, codec: meta.format.codec, duration: meta.format.duration}
                            };

                            await global.db.SalvaMusica(artista.Artista, musica, objMusica).then(() => {});
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

const retornaMusicaYoutube = (busca) => new Promise((success, reject) => {
    youtubeSearch.search(busca, {limit: 5})
        .then(x => {

            let listaBuscas = x.map(json => {
                return {
                    'IdMusica': json["id"],
                    'Url': json["url"],
                    'Titulo': json["title"],
                    'Duracao': json["duration"] / 1000,
                    'Capa': json["thumbnail"]["url"]
                }
            });

            success(listaBuscas);
        })
        .catch(err => reject(err));
});

const getRandomInteger = (max) => {
    return Math.floor(Math.random() * max);
}

exports.retornaListaArtista = function retornaListaArtista() {
    if (listaMusicasBanco.length > 0) {
        return listaMusicasBanco.map(x => {
            return {'Artista': x.name, 'Capa': 'public/image/capas/' + x.name + '.jpg'};
        });
    } else {
        return {};
    }
}

exports.retornaListaMusica = function retornaListaMusica(artista) {
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

exports.retornaDadosDashboard = function retornaDadosDashboard() {
    return {
        'TotalMusicas': totalMusica,
        'MusicasTocadas': musicasTocadas,
        'TotalTocadas': totalTocadas
    }
}

exports.salvaParametros = function salvaParametros(modo, valorCredito, topMusica, randomMusicas, youtubeMusicas, timeRandom) {
    return global.db.SalvaParametros(modo, valorCredito, topMusica, randomMusicas, youtubeMusicas, timeRandom);
}

exports.retornaParametros = retornaParametros;

exports.buscaMusica = function buscaMusica(artista, musica) {
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

abrirNavegador('http://localhost:8000');