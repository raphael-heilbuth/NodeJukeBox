class ControlesController {
    volume(req, res) {
        let volume = parseFloat(req.body.NivelVolume);
        res.status(200).json({'Sucesso': true});
        io.emit('volume', volume);
    }

    volumeMais(req, res) {
        res.status(200).json({'Sucesso': true});
        io.emit('volumeMais');
    }

    volumeMenos(req, res) {
        res.status(200).json({'Sucesso': true});
        io.emit('volumeMenos');
    }

    mute(req, res) {
        res.status(200).json({'Sucesso': true});
        io.emit('volume', 0.0);
    }

    pause(req, res) {
        res.status(200).json({'Sucesso': true});
        io.emit('pause', {'Pausar': true});
    }

    resume(req, res) {
        res.status(200).json({'Sucesso': true});
        io.emit('resume', {'Despausar': true});
    }

    credito(req, res) {
        let credito = parseInt(req.body.QtdCredito);

        res.status(200).json({'Sucesso': true});
        io.emit('credito', credito);
    }
}

module.exports = new ControlesController();
