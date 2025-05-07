//gets the respnse of the frontend (API of users connected)
const appU =require("express")
const corsU = require("cors")
const UserController = require("../controller/UserC")
const authMiddleware = require("../utils/authMiddleware")

const Route = appU.Router()
//we reuse cors here for double safe
Route.use(corsU())

//When someone sends data to /login, call the loginS function.
//Route.get("/users" ,Middleware ,Route Handler)
//the issue was in get users  
Route.get("/users" ,authMiddleware.authenticationToken ,UserController.getUsers)

module.exports = Route
