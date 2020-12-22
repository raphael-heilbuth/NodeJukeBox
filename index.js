const {json} = require('express');
let express = require('express')
let app = express()
const mm = require('music-metadata');
const util = require('util');
const configuracao = require("./config.json");
const musicFolder = configuracao.FolderMusic;
const ytdl = require('ytdl-core');
const youtubeSearch = require('youtube-sr');
const bodyParser = require("body-parser");
const fs = require('fs');
const path = require('path');
const listaMusicas = RetornaMusicas();
const abrirnavegador = require('open')

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/'));

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.render('index');
})

app.listen(8000, function () {
    console.log('Rodando na porta 8000')
})

app.get("/getList",  async function (req, res) {

    let musicasMeta = await RetornaListaMetaData(listaMusicas);

    listaMusicas["Youtube"] = {"Pesquisar": ""};
    listaMusicas["TOP"] = {"Top 10": "", "Top 20": "", "Top 30": "", "Top 40": "", "Top 50": "", "Top 100": ""};
    listaMusicas["Random"] = {"Random 1": "", "Random 3": "", "Random 5": "", "Random 10": ""};

    let orderedListaMusicas = {};


     Object.keys(listaMusicas).sort().forEach(function (v, i) {
        orderedListaMusicas[v] = listaMusicas[v];
    });

    res.json(orderedListaMusicas);
});

app.get("/playMusic", function (req, res) {
    let returnData = {};

    fs.readFile(musicFolder + '/' + req.query.artista + '/' + req.query.musica, function (err, file) {
        if (err) {
            returnData.success = false;
        } else {
            let base64File = new Buffer.from(file, 'binary').toString('base64');

            returnData.success = true;
            returnData.fileContent = base64File;
        }
        res.json(returnData);
    });
});

app.get("/tocaYoutube", function (req, res) {
    ytdl(req.query.IdMusica, {filter: 'audioonly', highWaterMark: 1 << 25}).pipe(res);
});

app.get("/buscaYoutube", function (req, res) {
    retornaMusicaYoutube(req.query.busca)
        .then(listaYoutube => {
            res.json(listaYoutube);
        })
});

app.get("/randomMusica", function (req, res) {
    let random = [];

    for (let i = 0; i < parseInt(req.query.Quantidade.replace("Random", "")); i++) {
        let artista = Object.keys(listaMusicas)[getRandomInteger(Object.keys(listaMusicas).length)],
            musica = Object.keys(listaMusicas[artista])[getRandomInteger(Object.keys(listaMusicas[artista]).length)],
            item = {
                'Artista': artista,
                'Musica': musica
            }

        random.push(item);
    }

    res.json(random);
});

function RetornaMusicas() {
    function readDir(dir) {
        let struct = {}

        fs
            .readdirSync(dir)
            .forEach(file => {
                if (fs.lstatSync(dir + "/" + file).isFile()) {
                    if (path.extname(file) === '.jpg') {
                        let diretorios = dir.split('/'),
                            artista = diretorios[diretorios.length - 1];
                        fs.copyFile(dir + "/" + file, 'public/image/capas/' + artista + '.jpg', (err) => {
                            if (err) throw err;
                        });
                    } else {
                        struct[file] = path.extname(file);
                    }
                } else if (fs.lstatSync(dir + "/" + file).isDirectory()) {
                    struct[file] = readDir(dir + "/" + file)
                }

            })

        return struct

    }

    return readDir(musicFolder);
}

const RetornaListaMetaData = (lista) => new Promise(async (success, reject) => {
    let retornoMeta = [];
    for (const pasta of Object.keys(lista)){
        let retornoMusica = []
        for (let musica of Object.entries(lista[pasta])) {
            await Promise.resolve(RetornaMetaData(configuracao.FolderMusic + "/" + pasta + "/" + musica[0]))
                .then(meta => {
                    retornoMusica.push({'Musica' : musica[0],'Meta' : meta})
                })
        }
        retornoMeta.push({'Artista' : pasta,'Musicas' : retornoMusica})
    }
    success(retornoMeta);
});
const RetornaMetaData = (file) => new Promise((success, reject) => {
    mm.parseFile(file)
        .then(metadata => {
            success(file = util.inspect(metadata, {showHidden: false, depth: null}));
        })
        .catch(err => {
            reject(console.error(err.message));
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
                    'Duracao': json["durationFormatted"],
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

//abrirnavegador('http://localhost:8000');