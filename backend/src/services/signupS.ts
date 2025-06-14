const User = require("../models/users");
const Employer = require("../models/employe");
const bcrypt = require("bcrypt");

interface UserData {
    name: string; 
    prenom: string;
    email: string;
    password: string; 
    telephone: string;
    adresse: string;
    matriculate: string;
}
 
async function createUser(userData: UserData) {
    const { name, prenom, email, password, telephone, adresse, matriculate } = userData;

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
        name,
        prenom,
        email,
        password: hashedPassword,
        role: "employer"
    });

    const savedUser = await newUser.save();

    const newEmployer = new Employer({
        _id: savedUser._id,
        telephone,
        adresse,
        matriculate,
        state: "pending"
    });

    await newEmployer.save();
    console.log(newEmployer)
    return savedUser;
}

module.exports = { createUser };
