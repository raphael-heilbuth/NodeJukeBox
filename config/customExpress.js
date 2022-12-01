const express = require('express')
const { createServer } = require("http");
const { Server } = require("socket.io");
const consign = require('consign')
const swaggerUi = require('swagger-ui-express');
const swaggerFile = require('../swagger/swagger_output.json')
const path = require("path");

module.exports = () => {
    const app = express()
    const httpServer = createServer(app);
    global.io = new Server(httpServer, { /* options */ });
    global.db = require('../data_base/db');
    app.use('views', express.static(path.join(__dirname, '../views')));
    app.use('/', express.static(path.join(__dirname, '../')));
    app.use(express.urlencoded({limit: "5mb", extended: true}));
    app.use(express.json({limit: "5mb"}));
    app.use('/swagger', swaggerUi.serve);
    app.get('/swagger', swaggerUi.setup(swaggerFile));

    consign()
        .include('routes')
        .into(app)

    return httpServer;
}
