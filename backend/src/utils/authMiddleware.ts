//this file check the headers it should contain the secretkey and if there is a token and does it 
// start with the word Bearer if everything is good the user can see the page , This helps protect our website 

import { Request, Response, NextFunction } from "express";

const jwt = require("jsonwebtoken")
const { secretKey } = require("../configuration/jwtConfig"); 

/*The problem here is that TypeScript doesn’t know that req.user can exist on 
the Request object, which causes it to throw the error "Property 'user' does not exist on type 'Request...'".*/
//This tells TypeScript that `Request` can have a `user` property
declare global {
    namespace Express {
      interface Request {
        user?: any;  // You can replace `any` with a more specific type, like { id: string }
      }
    }
  } 
  
function authenticationToken(req: Request,res:Response,next:NextFunction){
    const authHeader = req.header("Authorization");//contains what after "Authorization" (=Beare "token")

    if(!authHeader){
        return res.status(401).json({ message: "Unauthorized: Missing token!" });
      }
      const [bearer, token] = authHeader.split(" ");
      if(bearer !== "Bearer" || !token){
        return res.status(401).json({message :"Unauthorized : Invalid token!"});
      }
      
      //secretKey must be called as a string 
      jwt.verify(token, secretKey, (err:any, user:any)=>{
        if(err){
            console.log("\nToken received:", token);
            console.log("\nSecret key used:", secretKey);
            console.log('\nuser data:', user);
            return res.status(403).json({message :'Token verification failed:', err});
        }
         
        req.user = user
        next();//it means If the token is valid, calling next() allows the request to move on to the next function
      })
}

//creating a JWT refresh token API 
function verifyToken(token:string){
      return jwt.verify(token, secretKey);
      //utilisée pour vérifier et décoder un JWT  afin de s'assurer qu'il est valide et non falsifié.
}


module.exports ={
  verifyToken,
  authenticationToken}
