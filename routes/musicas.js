const MusicasController = require('../controller/musicas')
const { Router }  = require('express')
let router = Router()

module.exports = app => {

    router.get("/proxima", function (req, res) {
        // #swagger.tags = ['Musica']
        // #swagger.description = 'Endpoint para pular para próxima música na Jukebox.'

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Pulado a música com sucesso." }
        */
        MusicasController.proxima(req, res);
    });

    router.post("/selecionaMusica", function (req, res) {
        // #swagger.tags = ['Musica']
        // #swagger.description = 'Endpoint para adicionar uma música Jukebox.'

        /*	#swagger.parameters['obj'] = {
              in: 'body',
              description: 'Informações da música a ser tocada.',
              required: true,
              type: 'object',
              schema: { $ref: "#/definitions/SelecionaMusica" }
      } */

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Música adicionada com sucesso." }
        */
        MusicasController.selecionaMusica(req, res);

    })

    router.get("/listaArtista", function (req, res) {
        // #swagger.tags = ['Musica']
        // #swagger.description = 'Endpoint para retornar a lista de artista da Jukebox.'

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/RetornaArtistas" },
        description: "Artistas retornados com sucesso." }
        */
        MusicasController.listaArtistas(req, res);
    });

    router.get("/listaMusica", function (req, res) {
        // #swagger.tags = ['Musica']
        // #swagger.description = 'Endpoint para retornar a lista de música de um artista da Jukebox.'

        /* #swagger.parameters['Artista'] = {
               description: 'O artista para qual vai ser retornado a lista de música da JukeBox.',
               type: 'string'
        } */

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/RetornaMusicas" },
        description: "Músicas retornadas com sucesso." }
        */
        MusicasController.listaMusicas(req, res);
    });

    router.get("/topMusica", async function (req, res) {
        // #swagger.tags = ['Musica']
        // #swagger.description = 'Endpoint para retornar a quantidade de músicas mais tocadas'
        /* #swagger.parameters['Quantidade'] = {
              description: 'Quantidade de músicas a serem buscadas',
              type: 'string'
       } */
        MusicasController.topMusicas(req, res);
    });

    router.get("/randomMusica", function (req, res) {
        // #swagger.tags = ['Musica']
        // #swagger.description = 'Endpoint para retornar músicas aleatórias'
        /* #swagger.parameters['Quantidade'] = {
              description: 'Quantidade de músicas a serem buscadas',
              type: 'string'
       } */
        MusicasController.randomMusica(req, res);
    });

    router.get("/playMusic", function (req, res) {
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
        MusicasController.playMusica(req, res);
    });

    router.get("/getNewMusicas", function (_req, res) {
        MusicasController.getNewMusicas(_req, res);
    });

    router.get("/addMusicasBanco", function (req, res) {
        MusicasController.adicionaMusicasBanco(req, res);
    });

    router.get("/getList", async function (_req, res) {
        MusicasController.getList(_req, res);
    });

    app.use(router)
}
