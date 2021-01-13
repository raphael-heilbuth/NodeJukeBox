//
const rotas = require('express').Router();
const bodyParser = require("body-parser");
const funcoes = require('./index.js');

rotas.use(bodyParser.json());
rotas.use(bodyParser.urlencoded({
    extended: true
}));

rotas.get('/', function (req, res) {
    res.render('index');
})

rotas.post("/volume", function (req, res) {
    let volume = parseFloat(req.body.nivelVolume);
    res.json({'Sucesso': true});
    io.emit('volume', volume);
});

rotas.post("/volumeMais", function (req, res) {
    res.json({'Sucesso': true});
    io.emit('volumeMais');
});

rotas.post("/volumeMenos", function (req, res) {
    res.json({'Sucesso': true});
    io.emit('volumeMenos');
});

rotas.post("/mute", function (req, res) {
    res.json({'Sucesso': true});
    io.emit('volume', 0.0);
});

rotas.post("/credito", function (req, res) {
    let credito = parseInt(req.body.QtdCredito);
    res.json({'Sucesso': true});
    io.emit('credito', credito);
});

rotas.get("/proxima", function (req, res) {
    res.json({'Sucesso': true});
    io.emit('proxima', 1);
});

rotas.post("/selecionaMusica", function (req, res) {
    let musica = funcoes.buscaMusica(req.body.Artista, req.body.Musica);

    res.json({'Sucesso': musica !== {}});
    io.emit('musica', musica);
})

rotas.get("/listaArtista", function (req, res) {
    let lista = funcoes.retornaListaArtista();
    res.json(lista);
});

rotas.get("/listaMusica", function (req, res) {
    let lista = funcoes.retornaListaMusica(req.query.Artista);
    res.json(lista);
});

rotas.get("/getParametro",function (req,res){
    res.json({'Desenv' : (process.env.DESENV === "true"), 'TempoRandom' : process.env.TIMERANDOM || 240000});
})

rotas.get("/dashboard", function (req, res) {
    res.json(funcoes.retornaDadosDashboard());
})

module.exports = rotas;

