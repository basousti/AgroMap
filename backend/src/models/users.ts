const mongos = require ("../configuration/dbconfig")
//const userSchema = new mongos.Schema({}, { strict: false });

const userSchema = new mongos.Schema({
    name: { type: String, required: true },
    prenom:{ type: String, required: true },
    email: { type: String, unique: true }, 
    password:{ type: String, required: false},
    role:{ type: String, enum:["admin","employer","agriculteur"], required: true},
    
});

//I’ll create a model called user. This model will allow us to create, read, update, and delete users in the database 
//allows the program to interact with the user data in the database.user t7ot fih les données de userSchema , user hia 
//Collection name

module.exports = mongos.model("Utilisateur", userSchema);

 