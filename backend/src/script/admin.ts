const admin = require('../models/users')
const adminData = require('../models/employe')
const cryptPW = require('bcrypt')
 

async function createAdmin() {

    try {
        const existingAdmin = await admin.findOne({email:"badisoumayma018@gmail.com"});
        if(!existingAdmin) 
            {
            const createAdmin = new admin({
                name :'Oumayma',
                prenom:'badis', 
                email:'badisoumayma018@gmail.com', 
                password: await cryptPW.hash("7#oum@ym@53%", 10),
                role :"admin" ,
            });
            const savedAdmin = await createAdmin.save();
 
            const NewAdmin =  new adminData({
                _id :savedAdmin._id,
                telephone:'53102039',
                adresse:'Manzel Temim',
                matriculate:'14411916',
                state:"accepted",

            })
            await NewAdmin.save();
            console.log("new admin created suceccfully")}
        else{
            console.log("Admin already exists")
        }

    } catch (error:any) {
        console.log("error on creating admin",error.message)
    }
}

module.exports = createAdmin; 