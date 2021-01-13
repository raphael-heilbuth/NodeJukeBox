const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['./index.js','./rotas.js']

let doc = {
    info: {
        version: "1.0.0",
        title: "Node JukeBox API",
        description: "API de JukeBox"
    },
    definitions: {
        SelecionaMusica: {
            Artista: "Adele",
            Musica: "08. ADELE - 'Make You Feel My Love'.mp3"
        },
        Creditos: {
            QtdCredito: 10
        },
        Volume: {
            NivelVolume: 0.1
        }
    },
    host: "localhost:8000",
    basePath: "/",
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
};

swaggerAutogen(outputFile, endpointsFiles, doc).then(() => {
    require('./index.js')
})