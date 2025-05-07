const Express = require("express");
const RequestR= require("../controller/RequestMail");

const RqRouter = Express.Router();

RqRouter.post("/State", RequestR.updateEmployeeStatus);

module.exports= RqRouter; 