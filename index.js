const { json } = require('express');
var express = require('express')
var app = express()
const mm = require('music-metadata');
const util = require('util');
const configuracao = require("./config.json");
const musicFolder = configuracao.FolderMusic;
const ytdl = require('ytdl-core');
const youtubeSearch = require('youtube-sr');
const bodyParser = require("body-parser");

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/'));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', function (req, res) {
    res.render('index');
})

app.listen(8000, function () {
  console.log('Example app listening on port 8000!')
})

app.get("/getList", function(req, res){
    let json = RetornaMusicas();
    json["Youtube"] = {"Pesquisar" : ""};
    json["TOP"] = {"Top 10" : "", "Top 20" : "", "Top 30" : "", "Top 40" : "", "Top 50" : "", "Top 100" : ""};
    json["Random"] = {"Random 1" : "", "Random 3" : "", "Random 5" : "", "Random 10" : ""};
    res.json(json);
});

app.get("/playMusic", function(req, res){
    var fs = require('fs');
    var returnData = {};
    
    fs.readFile(musicFolder+'/'+req.query.artista+'/'+req.query.musica, function(err, file){
        if (err) {
            returnData.success = false;
        } else {
            var base64File = new  Buffer.from(file, 'binary').toString('base64');

            returnData.success = true;
            returnData.fileContent = base64File;
        }
        res.json(returnData);
    });
});

app.get("/tocaYoutube",function (req,res){
    ytdl(req.query.IdMusica, {filter: 'audioonly', highWaterMark: 1 << 25}).pipe(res);
});

app.get("/buscaYoutube",function (req,res){
    retornaMusicaYoutube(req.query.busca)
        .then(listaYoutube =>{
            res.json(listaYoutube);
        })
});

function RetornaMusicas() {        
    const fs = require('fs');
    const path = require('path');

    function readDir(dir){
        let struct = {}

        fs
            .readdirSync(dir)            
            .forEach(file => {
                if( fs.lstatSync(dir+"/"+file).isFile() ){
                    if (path.extname(file) === '.jpg') {
                        let diretorios = dir.split('/'),
                            artista = diretorios[diretorios.length - 1];
                        fs.copyFile(dir+"/"+file, 'public/image/capas/' + artista + '.jpg', (err) => {
                            if (err) throw err;                            
                          });
                    } else {
                        struct[file] = path.extname(file);
                    }
                }
                else if( fs.lstatSync(dir+"/"+file).isDirectory() ){
                    struct[file] = readDir(dir+"/"+file)
                }

            })

        return struct

    }

    return readDir(musicFolder);
}

function RetornaMetaData(file) {
    mm.parseFile(dir + "/" + file)
    .then(metadata => {
        success(file = util.inspect(metadata, { showHidden: false, depth: null }));
    })
    .catch(err => {
        reject(console.error(err.message));
    });
}

const retornaMusicaYoutube = (busca) => new Promise((success,reject) => {
    youtubeSearch.search(busca, {limit: 5})
        .then(x => {

            let listaBuscas = x.map(json => {
              return {
                  'IdMusica' : json["id"],
                  'Url' : json["url"],
                  'Titulo' : json["title"],
                  'Duracao' : json["durationFormatted"],
                  'Capa' : json["thumbnail"]["url"]
                }
            });

            success(listaBuscas);
        })
        .catch(err => reject(err));
});