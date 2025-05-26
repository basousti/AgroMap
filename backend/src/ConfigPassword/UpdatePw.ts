import { Request,Response } from "express";
import { console } from "inspector";
const bcryptPw =require("bcrypt") ;
const userToken = require("../models/verificationToken")//est un modèle mongoose
const UserModel = require("../models/users"); 

async function UpdatePw( newPassword: string) {
    try {

        const tokenDoc = await userToken.findOne();
        const UserEmail = tokenDoc.email
        const user = await UserModel.findOne({ email : UserEmail });
        if (!user) {
            throw new Error("User not found");
        }


        const salt = await bcryptPw.genSalt(10);
        const hashedPassword = await bcryptPw.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return { message: "Password updated successfully" };

    } catch (error: any) {
        throw new Error(`Problem in updating password: ${error.message}`);
    }
}

async function UpdatePassword(req: Request, res: Response)

    {
        try {
            const user = req.body;
            await UpdatePw(user.newPassword);
            res.status(201).json({ user: user, message: "Password updated successfully" });

            // Clear the verification code after successful verification
            const AllToken = await userToken.findOne();
            await userToken.deleteOne(AllToken);
            
        } catch (error) {
            console.log(error);
            res.status(400).json({ message: "Error updating password" });
        }
    }

module.exports = { UpdatePassword, UpdatePw };

