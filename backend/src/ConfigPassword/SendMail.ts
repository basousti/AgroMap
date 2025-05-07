import { Request, Response } from "express";
const Code = require("./GenerateCode");
const Nodemailer = require("nodemailer");
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

async function SendMail(req: Request, res: Response) {
    try {
        const { email } = req.body;
        const code = await Code.generateCode(email);

        //you should take this password from google not your app password Go to Google App Passwords
        const transporter = Nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465, 
            secure: true, 
            auth: {
                user: process.env.EMAIL_USER, 
                pass: process.env.EMAIL_PASS, 
            },
        });
        const mailOptions = {
            from: "AgroMap",
            to: email,
            subject: "Confirmation Email",
            text: `We have just received a password reset request , enter your verification code : ${code}`,
        };
        transporter.sendMail(mailOptions, (error: any, info: any) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            res.json({ message: "Verification code sent to your email" });

        });

    } catch (error: any) {
        throw new Error(`we didn't find credential: ${error.message}`);
    }
}


module.exports = {SendMail}