import { Request, Response } from 'express';
const userService = require("../services/signupS");

async function createUser(req: Request, res: Response) {
    try {
        const userData = req.body;
        const user = await userService.createUser(userData);
        res.status(201).json({ user: user, message: "User created successfully" });
    } catch (error:any) {
        res.status(400).json({ message: error.message });
    } 
} 
module.exports = { createUser };
 