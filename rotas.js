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
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para setar um volume na Jukebox.'

    /* #swagger.parameters['NivelVolume'] = {
           description: 'O volume que a JukeBox vai setar.',
           type: 'int'
    } */
    let volume = parseFloat(req.body.NivelVolume);
    res.json({'Sucesso': true});
    io.emit('volume', volume);
});

rotas.post("/volumeMais", function (req, res) {
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para diminuir o volume na Jukebox.'
    res.json({'Sucesso': true});
    io.emit('volumeMais');
});

rotas.post("/volumeMenos", function (req, res) {
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para aumentar o volume na Jukebox.'
    res.json({'Sucesso': true});
    io.emit('volumeMenos');
});

rotas.post("/mute", function (req, res) {
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para mutar a Jukebox.'
    res.json({'Sucesso': true});
    io.emit('volume', 0.0);
});

rotas.post("/credito", function (req, res) {
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para adicionar créditos na Jukebox.'

    /* #swagger.parameters['QtdCredito'] = {
           description: 'A quantidade de crédito que vai ser inserido na JukeBox.',
           type: 'int'
    } */
    let credito = parseInt(req.body.QtdCredito);
    res.json({'Sucesso': true});
    io.emit('credito', credito);
});

rotas.get("/proxima", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para pular para próxima música na Jukebox.'
    res.json({'Sucesso': true});
    io.emit('proxima', 1);
});

rotas.post("/selecionaMusica", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para adicionar uma música Jukebox.'

    /* #swagger.parameters['Artista'] = {
           description: 'O artista da música que deva ser tocada na JukeBox.',
           type: 'string'
    } */
    /* #swagger.parameters['Musica'] = {
           description: 'A música que deve ser tocada na JukeBox.',
           type: 'string'
    } */
    let musica = funcoes.buscaMusica(req.body.Artista, req.body.Musica);

    res.json({'Sucesso': musica !== {}});
    io.emit('musica', musica);
})

rotas.get("/listaArtista", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para retornar a lista de artista da Jukebox.'

    let lista = funcoes.retornaListaArtista();
    res.json(lista);
});

rotas.get("/listaMusica", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para retornar a lista de música de um artista da Jukebox.'

    /* #swagger.parameters['Artista'] = {
           description: 'O artista para qual vai ser retornado a lista de música da JukeBox.',
           type: 'string'
    } */
    let lista = funcoes.retornaListaMusica(req.query.Artista);
    res.json(lista);
});

rotas.get("/getParametro",function (req,res){
    // #swagger.tags = ['Parametros']
    // #swagger.description = 'Endpoint para retornar os parametros configurados na Jukebox.'
    res.json({'Desenv' : (process.env.DESENV === "true"), 'TempoRandom' : process.env.TIMERANDOM || 240000});
})

rotas.get("/dashboard", function (req, res) {
    // #swagger.tags = ['Dashboard']
    // #swagger.description = 'Endpoint para retornar os dados da dashboard da Jukebox.'
    res.json(funcoes.retornaDadosDashboard());
})

module.exports = rotas;

