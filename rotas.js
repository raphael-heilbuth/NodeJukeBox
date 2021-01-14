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

    /*	#swagger.parameters['obj'] = {
      in: 'body',
      description: 'O volume que vai ser setado na JukeBox',
      required: true,
      type: 'object',
      schema: { $ref: "#/definitions/Volume" }
    } */

    let volume = parseFloat(req.body.NivelVolume);

    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/Success" },
    description: "Volume alterado com sucesso." }
    */
    res.status(200).json({'Sucesso': true});
    io.emit('volume', volume);
});

rotas.post("/volumeMais", function (req, res) {
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para diminuir o volume na Jukebox.'

    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/Success" },
    description: "Volume abaixado com sucesso." }
    */
    res.status(200).json({'Sucesso': true});
    io.emit('volumeMais');
});

rotas.post("/volumeMenos", function (req, res) {
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para aumentar o volume na Jukebox.'

    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/Success" },
    description: "Volume aumentado com sucesso." }
    */
    res.status(200).json({'Sucesso': true});
    io.emit('volumeMenos');
});

rotas.post("/mute", function (req, res) {
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para mutar a Jukebox.'


    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/Success" },
    description: "Volume mutado com sucesso." }
    */
    res.status(200).json({'Sucesso': true});
    io.emit('volume', 0.0);
});

rotas.post("/pause",function (req,res){
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para pausar a Jukebox.'


    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/Success" },
    description: "Música pausada com sucesso." }
    */
    res.status(200).json({'Sucesso': true});
    io.emit('pause', {'Pausar': true});
});

rotas.post("/resume",function (req,res){
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para despausar a Jukebox.'


    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/Success" },
    description: "Música despausada com sucesso." }
    */
    res.status(200).json({'Sucesso': true});
    io.emit('resume', {'Despausar': true});
});

rotas.post("/credito", function (req, res) {
    // #swagger.tags = ['Controles']
    // #swagger.description = 'Endpoint para adicionar créditos na Jukebox.'

    /*	#swagger.parameters['obj'] = {
      in: 'body',
      description: 'A quantidade de crédito que vai ser inserido na JukeBox.',
      required: true,
      type: 'object',
      schema: { $ref: "#/definitions/Creditos" }
    } */

    let credito = parseInt(req.body.QtdCredito);

    /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Crédito adicionado com sucesso." }
    */

    res.status(200).json({'Sucesso': true});
    io.emit('credito', credito);
});

rotas.get("/proxima", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para pular para próxima música na Jukebox.'

    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/Success" },
    description: "Pulado a música com sucesso." }
    */
    res.status(200).json({'Sucesso': true});
    io.emit('proxima', 1);
});

rotas.post("/selecionaMusica", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para adicionar uma música Jukebox.'

    /*	#swagger.parameters['obj'] = {
          in: 'body',
          description: 'Informações da música a ser tocada.',
          required: true,
          type: 'object',
          schema: { $ref: "#/definitions/SelecionaMusica" }
  } */

    let musica = funcoes.buscaMusica(req.body.Artista, req.body.Musica);

    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/Success" },
    description: "Música adicionada com sucesso." }
    */
    res.status(200).json({'Sucesso': musica !== {}});
    io.emit('musica', musica);
})

rotas.get("/listaArtista", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para retornar a lista de artista da Jukebox.'

    let lista = funcoes.retornaListaArtista();
    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/RetornaArtistas" },
    description: "Artistas retornados com sucesso." }
    */
    res.status(200).json(lista);
});

rotas.get("/listaMusica", function (req, res) {
    // #swagger.tags = ['Musica']
    // #swagger.description = 'Endpoint para retornar a lista de música de um artista da Jukebox.'

    /* #swagger.parameters['Artista'] = {
           description: 'O artista para qual vai ser retornado a lista de música da JukeBox.',
           type: 'string'
    } */
    let lista = funcoes.retornaListaMusica(req.query.Artista);

    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/RetornaMusicas" },
    description: "Músicas retornadas com sucesso." }
    */
    res.status(200).json(lista);
});

rotas.get("/getParametro",function (req,res){
    // #swagger.tags = ['Parametros']
    // #swagger.description = 'Endpoint para retornar os parâmetros configurados na Jukebox.'

    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/RetornaParametros" },
    description: "Parâmetros retornadas com sucesso." }
    */
    res.status(200).json({'Desenv' : (process.env.DESENV === "true"), 'TempoRandom' : process.env.TIMERANDOM || 240000});
})

rotas.get("/dashboard", function (req, res) {
    // #swagger.tags = ['Dashboard']
    // #swagger.description = 'Endpoint para retornar os dados da dashboard da Jukebox.'

    /* #swagger.responses[200] = {
    schema: { "$ref": "#/definitions/RetornaDashboard" },
    description: "Dados dashboard retornados com sucesso." }
    */
    res.status(200).json(funcoes.retornaDadosDashboard());
})

module.exports = rotas;

