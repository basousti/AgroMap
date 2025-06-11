const { verifyToken } = require("../utils/authMiddleware");
const Employee = require("../models/employe");
const Puser = require("../models/users");

async function ProfileS(GeneratedToken: string) {
  try {
    const decodedToken = verifyToken(GeneratedToken);

    const existingUser = await Puser.findOne({ email: decodedToken.email }).select("name prenom email role");
    if (!existingUser) {
      throw new Error("User not found from token");
    }

    let profileData: any = {
      name: existingUser.name,
      prenom: existingUser.prenom,
      email: existingUser.email,
    };

    if (existingUser.role === "employer") {
      const employerData = await Employee.findOne({ _id: existingUser._id }).select("telephone adresse matriculate");
      if (employerData) {
        profileData = {
          ...profileData,
          telephone: employerData.telephone,
          adresse: employerData.adresse,
          matriculate: employerData.matriculate,
        };
      }
    } 
 
    return profileData;

  } catch (error: any) {
    throw new Error(`Échec de la récupération du profil : ${error.message}`);
  }
}

module.exports = { ProfileS };
