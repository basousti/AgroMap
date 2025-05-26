const express = require("express");
const signupController= require("../controller/signupC");

const router = express.Router();

router.post("/register",signupController.createUser);

module.exports= router; 

