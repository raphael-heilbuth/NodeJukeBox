var express = require('express')
var app = express()
const mm = require('music-metadata');
const util = require('util');
const configuracao = require("./config.json");
const musicFolder = configuracao.FolderMusic;

app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/'));

app.get('/', function (req, res) {
    res.render('index');
})

app.listen(8000, function () {
  console.log('Example app listening on port 8000!')
})

app.get("/getList", function(req, res){
    res.json(RetornaMusicas());
});

app.get("/playMusic", function(req, res){
    var fs = require('fs');
    var returnData = {};
    
    fs.readFile(musicFolder+'/'+req.query.artista+'/'+req.query.musica, function(err, file){
        var base64File = new  Buffer.from(file, 'binary').toString('base64');

        returnData.fileContent = base64File;

        res.json(returnData);
    });
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