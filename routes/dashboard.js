const MusicasController = require('../controller/musicas')
const { Router }  = require('express')
let router = Router()

module.exports = app => {

    router.get("/dashboard", function (req, res) {
        // #swagger.tags = ['Dashboard']
        // #swagger.description = 'Endpoint para retornar os dados da dashboard da Jukebox.'

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/RetornaDashboard" },
        description: "Dados dashboard retornados com sucesso." }
        */
        res.status(200).json(MusicasController.retornaDadosDashboard());
    })

    app.use(router)
}
