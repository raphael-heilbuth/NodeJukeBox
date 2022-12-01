const fs = require("fs");
const getRandomInteger = (max) => {
    return Math.floor(Math.random() * max);
}

const getBoolean = (value) => {
    switch(value){
        case true:
        case "true":
        case 1:
        case "1":
        case "on":
        case "yes":
            return true;
        default:
            return false;
    }
}

const listaArquivosPasta = (diretorio) => {
    let arquivos = []

    fs
        .readdirSync(diretorio)
        .filter(file => {
            arquivos.push(diretorio + '/' + file);
        });

    return arquivos
}

module.exports = {getRandomInteger, getBoolean, listaArquivosPasta}
