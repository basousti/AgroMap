import { Request, Response } from "express";
const bcryptPw = require("bcrypt");
const UserModel = require("../models/users");

async function ChangePw(email: string, currentPassword: string, newPassword: string) {
    const user = await UserModel.findOne({ email });
    if (!user) throw new Error("User not found");

    const isMatch = await bcryptPw.compare(currentPassword, user.password);
    if (!isMatch) throw new Error("Current password is incorrect");

    if (currentPassword === newPassword) {
        throw new Error("New password must be different from current");
    }
    if (newPassword.length < 8) {
        throw new Error("Password must be at least 8 characters");
    }

    const hashedPassword = await bcryptPw.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return { success: true, message: "Password updated successfully" };
}


async function ChangePassword(req: Request, res: Response) {
    try {
        const { currentPassword, newPassword } = req.body;
        const email = req.user.email; // From token

        const result = await ChangePw(email, currentPassword, newPassword);
        if (!result.success) {
            return res.status(400).json({ message: result.message });
        }

        return res.status(200).json({ message: result.message });
    } catch (error: any) {
        return res.status(400).json({
            success: false,
            message: "changepw controller: " + error.message,
        });
    }
}

module.exports = {
  ChangePassword,
  ChangePw
};


