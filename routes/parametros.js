const ParametrosController = require('../controller/parametros')
const { Router }  = require('express')
let router = Router()

module.exports = app => {

    router.post("/setParametro",function (req, res){
        // #swagger.tags = ['Parametros']
        // #swagger.description = 'Endpoint para salvar os parâmetros na Jukebox.'

        /*	#swagger.parameters['obj'] = {
              in: 'body',
              description: 'Parametros a ser usado na JukeBox.',
              required: true,
              type: 'object',
              schema: { $ref: "#/definitions/RetornaParametros" }
        } */

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Música adicionada com sucesso." }
        */

        ParametrosController.setParametros(req, res);
    })

    router.get("/getParametro",function (req, res) {
        // #swagger.tags = ['Parametros']
        // #swagger.description = 'Endpoint para retornar os parâmetros configurados na Jukebox.'

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/RetornaParametros" },
        description: "Parâmetros retornadas com sucesso." }
        */

        ParametrosController.getParametros(req, res);
    })

    app.use(router)
}
