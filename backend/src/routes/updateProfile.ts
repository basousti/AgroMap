const Profile =require("express")
const Cors = require("cors")
const UpdateProfil =require("../controller/updateProfile")

const Router = Profile.Router()

//we reuse cors here for double safe
Router.use(Cors())


Router.post("/NewData", UpdateProfil.UpdateProfileController);


module.exports = Router
