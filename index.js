let express = require('express')
let app = express()
const mm = require('music-metadata');
const configuracao = require("./config.json");
const musicFolder = configuracao.FolderMusic;
const ytdl = require('ytdl-core');
const youtubeSearch = require('youtube-sr');
const bodyParser = require("body-parser");
const fs = require('fs');
const path = require('path');
let musicasMeta = {};
const abrirnavegador = require('open');
global.db = require('./db');

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
    let listaMusicas = RetornaMusicas();

    musicasMeta = await RetornaListaMetaData(listaMusicas);

    musicasMeta["Youtube"] = {"Musicas": [
        {"Musica": "Pesquisar", "Meta": null}
        ]};
    musicasMeta["TOP"] = {"Musicas": [
            {"Musica": "Top 10", "Meta": null},
            {"Musica": "Top 20", "Meta": null},
            {"Musica": "Top 30", "Meta": null},
            {"Musica": "Top 40", "Meta": null},
            {"Musica": "Top 50", "Meta": null},
            {"Musica": "Top 100", "Meta": null}
            ]};
    musicasMeta["Random"] = {"Musicas": [
            {"Musica": "Random 1", "Meta": null},
            {"Musica": "Random 3", "Meta": null},
            {"Musica": "Random 5", "Meta": null},
            {"Musica": "Random 10", "Meta": null}
        ]};

    let orderedListaMusicas = {};

     Object.keys(musicasMeta).sort().forEach(function (v) {
        orderedListaMusicas[v] = musicasMeta[v];
    });

    res.json(orderedListaMusicas);
});

app.get("/playMusic", function (req, res) {
    let returnData = {};

    fs.readFile(musicFolder + '/' + req.query["artista"] + '/' + req.query["musica"], function (err, file) {
        if (err) {
            returnData.success = false;
        } else {
            global.db.CountMusica(req.query["artista"], req.query["musica"]);
            let base64File = new Buffer.from(file, 'binary').toString('base64');

            returnData.success = true;
            returnData.fileContent = base64File;
        }
        res.json(returnData);
    });
});

app.get("/tocaYoutube", function (req, res) {
    ytdl(req.query.IdMusica, {highWaterMark: 1 << 25}).pipe(res);
});

app.get("/buscaYoutube", function (req, res) {
    retornaMusicaYoutube(req.query["busca"])
        .then(listaYoutube => {
            res.json(listaYoutube);
        })
});

app.get("/randomMusica", function (req, res) {
    let random = [];

    for (let i = 0; i < parseInt(req.query["Quantidade"].replace("Random", "")); i++) {
        let artista = Object.keys(musicasMeta)[getRandomInteger(Object.keys(musicasMeta).length)],
            musicas = musicasMeta[artista]["Musicas"][getRandomInteger(musicasMeta[artista]["Musicas"].length)],
            item = {
                'Artista': artista,
                'Musica': musicas["Musica"],
                'Duracao': musicas["Meta"]["format"]["duration"],
                'Tipo': path.extname(musicas["Musica"])
            }

        random.push(item);
    }

    res.json(random);
});

app.get("/topMusica", async function (req, res) {
    let top = [],
        arrayTop = await global.db.RetornaTopMusicas(parseInt(req.query["Quantidade"].replace("Top", "")));

    Array.from(arrayTop).forEach(el => {
        let musicas = musicasMeta[el["Artista"]["0"]["name"]]["Musicas"].find(x => x.Musica === el["title"]),
            item = {
                'Artista': el["Artista"]["0"]["name"],
                'Musica': musicas["Musica"],
                'Duracao': musicas["Meta"]["format"]["duration"],
                'Tipo': path.extname(musicas["Musica"])
            }

        top.push(item);
    });

    res.json(top);
});

function RetornaMusicas() {
    function readDir(dir) {
        let struct = {}

        fs
            .readdirSync(dir)
            .forEach(file => {
                if (fs.lstatSync(dir + "/" + file).isFile()) {
                    if (path.extname(file) === '.jpg' || path.extname(file) === '.JPG') {
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

const RetornaListaMetaData = (lista) => new Promise(async (success) => {
    let retornoMeta = [],
        totalTocadas = await global.db.TotalTocadas();
    for (const pasta of Object.keys(lista)){
        let retornoMusica = [],
            tocadasArtista = await global.db.PopularidadeArtista(pasta);
        for (let musica of Object.entries(lista[pasta])) {
            if (musica[0].includes('.mp3') || musica[0].includes('.mp4')) {
                await RetornaMetaData(configuracao.FolderMusic + "/" + pasta + "/" + musica[0])
                    .then(meta => {
                        global.db.PopularidadeMusica(pasta, musica[0]).then(tocadasMusica => {
                            retornoMusica.push({'Musica': musica[0], 'Tipo': path.extname(musica[0]), 'Meta': meta, 'PopularidadeGlobal': (100 / totalTocadas) * tocadasMusica, 'PopularidadeArtista': (100 / tocadasArtista) * tocadasMusica});
                        })
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }
        }
        retornoMeta[pasta] = {'Musicas' : retornoMusica, 'Popularidade':  (100 / totalTocadas) * tocadasArtista }
    }
    success(retornoMeta);
});
const RetornaMetaData = (file) => new Promise((success, reject) => {
    mm.parseFile(file)
        .then(metadata => {
            success(metadata);
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

abrirnavegador('http://localhost:8000');