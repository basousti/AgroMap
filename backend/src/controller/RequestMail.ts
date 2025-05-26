// this file takes action = 'accept' or 'reject' from the frontend and sends an email to the user 
// ne9sa fekret el router , 
//notification au admin , les credential mta3 luser yet7atou fi table when he is pendis w yetna7aw ki ya3mel ayy action

import { Request, Response } from 'express';
import dotenv from "dotenv";
const Nodemailer = require("nodemailer");
const Employee = require("../models/employe")
const User = require("../models/users")
 
dotenv.config();

async function updateEmployeeStatus(req: Request, res: Response) {
    try {

        const { matriculate,action } = req.body;

        const employee = await Employee.findOne({matriculate});
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        employee.state = action === 'accept' ? 'accepted' : 'rejected';
        await employee.save();

        const user = await User.findById(employee._id);
        if (!user) return res.status(404).json({ message: 'User not found for this employee' });

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
            to: user.email,
            subject: action === 'accept' ? 'Votre création de compte est accepté' : 'Votre création de compte est rejeté',
            text: action === 'accept'
                ? 'Félicitations, votre compte a été créer avec succé.'
                : 'Nous sommes désolés, votre demande a été rejetée.',
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: `Employee ${action}ed successfully` });

    } catch (error: any) {
        console.error("Email sending failed:", error); // Add this line
        return res.status(500).json({ error: error.message });
    }
    
}


module.exports = { updateEmployeeStatus }
