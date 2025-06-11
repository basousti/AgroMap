import { Request, Response } from "express";
const { ProfileS } = require("../services/ProfileS") 
 

async function ProfileC(req: Request, res: Response) {
    try {
        const authHeader = req.headers["authorization"];
        const token = authHeader?.split(" ")[1];

        if (!token) {
            throw new Error("User token not found");
        }

        const userProfile = await ProfileS(token);
        res.status(200).json(userProfile);

    } catch (error: any) {
        console.log("ProfileC\t", error.message);
    }
}

module.exports = { ProfileC };