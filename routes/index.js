const { Router }  = require('express')
const path = require("path");
let router = Router()

module.exports = app => {

    router.get('/', function (req, res) {
        res.sendFile(path.join(__dirname, '../views/index.html'));
    })

    app.use(router)
}
