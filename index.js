require('dotenv').config({path:'./config/.env'})
const customExpress = require('./config/customExpress')
const abrirNavegador = require("open");
const app = customExpress();
const port = process.env.PORTASERV || 8000

app.listen(port, () => {
    console.log(`Site rodando na porta: ${port}`)
})

abrirNavegador(`http://localhost:${port}`);
