const UserModel = require("../models/users");
const EmployeProfile = require("../models/employe");
const TokenVerify  = require("../utils/authMiddleware");

interface UserData {
    name: string;
    prenom: string;
    email: string;
 
    telephone: string;
    adresse: string;
    matriculate: string;
}

async function UpdateProfile(generatedToken: string, userData: UserData) {
    try {
        const { name, prenom, email, telephone, adresse, matriculate } = userData;

        const decoded = TokenVerify.verifyToken(generatedToken);
        console.log("verifyToken:", decoded);
        const userId = decoded.id;
        console.log("userId:", userId);

        const existingUser = await UserModel.findById(userId);

        if (!existingUser) {
            throw new Error("User not found");
        }

        // Update basic user fields
        existingUser.name = name ;
        existingUser.prenom = prenom ;
        existingUser.email = email ;

        await existingUser.save(); 

        
        if (existingUser.role === "employer") {
            let employerData = await EmployeProfile.findOne({ _id: existingUser._id });
            
            if (!employerData) {
                console.log("User not found in emloyee collection");
            } else {
                employerData.telephone = telephone ;
                employerData.adresse = adresse ;
                employerData.matriculate = matriculate ;
            }
            
            await employerData.save(); 
        }

        return { message: "Profile data updated successfully" };
    } catch (error: any) {
        throw new Error(`Problem in updating profile: ${error.message}`);
    }
}


module.exports = { UpdateProfile };


// Error: Problem in updating profile: VerifyToken is not a function "means that your code is trying to call VerifyToken() from require("../utils/authMiddleware"), 
// but what you're importing does not actually export a function named VerifyToken — or it’s not exported correctly."
