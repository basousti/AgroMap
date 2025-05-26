//creating login service 
const bcrypte = require("bcrypt")
const Users = require('../models/users') 
const Employer = require("../models/employe");
const {verifyToken} = require("../utils/authMiddleware")
import { generateToken } from "../utils/JWTutils";


async function loginS(email: string, password: string) {
  try {
    
    const existingUser = await Users.findOne({ email });

    if (!existingUser) {
      throw new Error("Utilisateur introuvable");
    } 

    // Fetch employer-specific data
    if (existingUser.role === "employer") {
      const employerData = await Employer.findById(existingUser._id);
      if (!employerData || employerData.state !== "accepted") {
        throw new Error("Compte en attente de validation.");
      }
    }
 
    const isPWvalid = await bcrypte.compare(password, existingUser.password);
    if (!isPWvalid) {
      throw new Error("Mot de passe incorrect.");
    }

    const token = generateToken(existingUser);
    console.log("Token \t",token);
    return token;

  } catch (error: any) {
    throw new Error(`Échec de la connexion : ${error.message}`);
  }
}

async function refreshToken(oldtoken:string) {
    try {
        const decodedToken =verifyToken(oldtoken);
        Users.findById(decodedToken._id);
        if(!Users){
            throw new Error("User not found of this token")
        };
        const newToken = generateToken(Users);
        return newToken;
       }
    catch (error:any) {
        throw new Error(`we didn't find credential: ${error.message}`);
        }
}
module.exports={refreshToken,loginS}


//this returns an object return{ token};
//this returns a string return token;

//const isPWvalid = bcrypte.compare(password, existingUser.password); : in this case it returns always true and you will have access on all PW 
//const isPWvalid =await bcrypte.compare(password, existingUser.password); :Now it will correctly return true or false, depending on the password match.
    