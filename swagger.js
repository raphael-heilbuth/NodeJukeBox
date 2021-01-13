const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger_output.json'
const endpointsFiles = ['./index.js','./rotas.js']

let doc = {
    info: {
        version: "1.0.0",
        title: "Node JukeBox API",
        description: "API de JukeBox"
    },
    host: "localhost:3000",
    basePath: "/",
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
};

swaggerAutogen(outputFile, endpointsFiles,doc).
then(()=>{

});