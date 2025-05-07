//npm i jsonwebtoken (generate tokens for every user and store them in cookies)
//jwt is like giving every user who is logged in a token so you don't 
// need to enter your password again and again to stay connected 


const jwt = require("jsonwebtoken");
const {secretKey} = require("../configuration/jwtConfig")


function generateToken(user: any) {
    const payload = {
        id: user._id,
        name: user.name,
        matriculate: user.matriculate,
        email: user.email,
        role: user.role
    };
    return jwt.sign(payload, secretKey, { expiresIn: "1h" }); 
}
// ✅ Use ES Modules export t3aytelha bel import {generateToken} from ...
export { generateToken };

//this is commonJS t3aytelha bel require() whaka const {generateToken}
//  module.exports = {generateToken};
