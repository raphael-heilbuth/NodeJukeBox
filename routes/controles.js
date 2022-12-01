const ControlesController = require('../controller/controles')
const { Router }  = require('express')
let router = Router()

module.exports = app => {

    router.post("/volume", function (req, res) {
        // #swagger.tags = ['Controles']
        // #swagger.description = 'Endpoint para setar um volume na Jukebox.'

        /*	#swagger.parameters['obj'] = {
          in: 'body',
          description: 'O volume que vai ser setado na JukeBox',
          required: true,
          type: 'object',
          schema: { $ref: "#/definitions/Volume" }
        } */

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Volume alterado com sucesso." }
        */

        ControlesController.volume(req, res);
    });

    router.post("/volumeMais", function (req, res) {
        // #swagger.tags = ['Controles']
        // #swagger.description = 'Endpoint para diminuir o volume na Jukebox.'

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Volume abaixado com sucesso." }
        */

        ControlesController.volumeMais(req, res);
    });

    router.post("/volumeMenos", function (req, res) {
        // #swagger.tags = ['Controles']
        // #swagger.description = 'Endpoint para aumentar o volume na Jukebox.'

        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Volume aumentado com sucesso." }
        */

        ControlesController.volumeMenos(req, res);
    });

    router.post("/mute", function (req, res) {
        // #swagger.tags = ['Controles']
        // #swagger.description = 'Endpoint para mutar a Jukebox.'


        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Volume mutado com sucesso." }
        */

        ControlesController.mute(req, res);
    });

    router.post("/pause",function (req, res){
        // #swagger.tags = ['Controles']
        // #swagger.description = 'Endpoint para pausar a Jukebox.'


        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Música pausada com sucesso." }
        */

        ControlesController.pause(req, res);
    });

    router.post("/resume",function (req, res){
        // #swagger.tags = ['Controles']
        // #swagger.description = 'Endpoint para despausar a Jukebox.'


        /* #swagger.responses[200] = {
        schema: { "$ref": "#/definitions/Success" },
        description: "Música despausada com sucesso." }
        */

        ControlesController.resume(req, res);
    });

    router.post("/credito", function (req, res) {
        // #swagger.tags = ['Controles']
        // #swagger.description = 'Endpoint para adicionar créditos na Jukebox.'

        /*	#swagger.parameters['obj'] = {
          in: 'body',
          description: 'A quantidade de crédito que vai ser inserido na JukeBox.',
          required: true,
          type: 'object',
          schema: { $ref: "#/definitions/Creditos" }
        } */

        /* #swagger.responses[200] = {
            schema: { "$ref": "#/definitions/Success" },
            description: "Crédito adicionado com sucesso." }
        */

        ControlesController.credito(req, res);
    });

    app.use(router)
}
