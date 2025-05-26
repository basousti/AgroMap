const App =require("express")
const Fcors = require("cors")
const ForgetPw = require("./SendMail")
const verification=require("./GenerateCode")
const NewPassword = require("./UpdatePw")
const Frouter = App.Router()

//we reuse cors here for double safe
Frouter.use(Fcors())


Frouter.post("/password", ForgetPw.SendMail);
Frouter.post("/Code", verification.VerifyCode);
Frouter.post("/UpdatePw", NewPassword.UpdatePassword);


module.exports = Frouter
