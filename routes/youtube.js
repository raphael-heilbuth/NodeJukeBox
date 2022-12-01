const { Router }  = require('express')
const ytdl = require("ytdl-core");
const {retornaMusicaYoutube} = require("../controller/youtube");
let router = Router()

module.exports = app => {
    router.get("/tocaYoutube", function (req, res) {
        // #swagger.tags = ['Youtube']
        // #swagger.description = 'Endpoint para enviar para o site música do youtube a ser tocada'

        ytdl(req.query.IdMusica, {highWaterMark: 1 << 25}).pipe(res);
    });

    router.get("/buscaYoutube", function (req, res) {
        // #swagger.tags = ['Youtube']
        // #swagger.description = 'Endpoint para retornar as primeiras 5 músicas da pesquisa'
        /* #swagger.parameters['busca'] = {
              description: 'Música a ser buscada',
              type: 'string'
       } */

        retornaMusicaYoutube(req.query["busca"])
            .then(listaYoutube => {
                res.json(listaYoutube);
            })
    });

    app.use(router)
}
