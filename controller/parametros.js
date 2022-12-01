class ParametrosController {
    setParametros(req, res) {
        db.SalvaParametros(req.body.modo, req.body.valorCredito, req.body.topMusicas, req.body.randomMusicas, req.body.youtubeMusicas, req.body.timeRandom)
            .then(() => {
                res.status(200).json({'Sucesso': true});
            })
            .catch(err => {
                res.status(500).json(err);
            });
    }

    getParametros(req, res) {
        this.retornaParametros()
            .then((parametros) => {
                res.status(200).json(parametros);
            })
            .catch(err => {
                res.status(500).json(err);
            });
    }

    retornaParametros = () => new Promise((success, reject) => {
        db.RetornaParametros()
            .then((parametros) => {
                if (parametros === null) {
                    parametros = {
                        modo: 'Ficha',
                        valorCredito: 0.50,
                        topMusicas: true,
                        randomMusicas: true,
                        youtubeMusicas: true,
                        timeRandom: 240000
                    }
                }

                success(parametros);
            })
            .catch(err => {
                reject(err);
            });
    });
}

module.exports = new ParametrosController;
