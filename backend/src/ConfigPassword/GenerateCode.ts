const UserF = require("../models/users");
const userToken = require("../models/verificationToken")
const characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz0123456789";
import { Request, Response } from "express";


async function generateCode ( email:String) {
    let verificationCode = "";
    let Length = 6;
    try {
        const existingUser = await UserF.findOne({ email  })
        if(!existingUser){
            throw new Error ("User not found");
        }
        
        for (let i = 0; i < Length; i++) {
                const randomIndex = Math.floor(Math.random() * characters.length);
                verificationCode += characters[randomIndex];
            }    
        
        console.log(verificationCode);

        const verificationExpires = Date.now() + 10 * 60 * 1000; // Code expires in 10 minutes
        const newToken = new userToken({
            email,
            verificationCode,
            verificationExpires
        });
        
        await newToken.save();
        console.log("Verification token saved successfully!");

        return verificationCode;

    } catch (error:any) {
        throw new Error(`we didn't find credential: ${error.message}`);
    }
} 

// fezet el mail bch yebda kolchayy en cordination

async function VerifyCode(req: Request, res: Response) {
    try {
        const { verificationCode } = req.body;
        const UserCode = await userToken.findOne({ verificationCode });

        if (!UserCode) {
            return res.status(400).json({ message: "this user doesn't exist" });
        }
 
        console.log("Stored Code in DB:", UserCode.verificationCode);
        console.log("User Entered Code:", verificationCode);

        // Check if the code matches and hasn't expired
        if (
            UserCode.verificationCode !== verificationCode ||
            UserCode.verificationExpires < Date.now()
        ) {
            console.log(Date.now())
            return res.status(400).json({ message: "Incorrect or expired code" });
        }
         
        return res.status(200).json({ message: "Code is correct" });

    } catch (error: any) {
        return res.status(400).json({ message: error.message });
    }
}

module.exports = {generateCode,VerifyCode}

