const app =require("express")
const cors = require("cors")
const loginController = require("../controller/loginC")
const Lrouter = app.Router()
//we reuse cors here for double safe
Lrouter.use(cors())

//When someone sends data to /login, call the loginS function.
Lrouter.post("/login", loginController.loginC)
Lrouter.post("/refresh-token", loginController.refreshTokenC)

module.exports = Lrouter
