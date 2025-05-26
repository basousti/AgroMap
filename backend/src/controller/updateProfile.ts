import { Request, Response } from "express";
const { UpdateProfile } = require("../services/updateProfile");

async function UpdateProfileController(req: Request, res: Response) {
    try {
        const userData = req.body;
        const authHeader = req.headers["authorization"];
        console.log("Authorization header:\t", authHeader);

        const token = authHeader?.split(" ")[1];
        if (!token) {
            throw new Error("User token not found");
        }

        const user = await UpdateProfile(token, userData);

        res.status(200).json({ user, message: "Profile updated successfully" });
    } catch (error: any) {
        console.error(error);
        res.status(400).json({ message: error.message || "Error updating profile" });
    }
}

module.exports = { UpdateProfileController };
