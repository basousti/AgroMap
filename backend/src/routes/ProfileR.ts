const profile=require("express")
const corse = require("cors")
const {ProfileC} =require("../controller/ProfileC")

const ProfileRoute = profile.Router()
ProfileRoute.use(corse())
 
ProfileRoute.get("/profile",ProfileC)

module.exports = ProfileRoute
