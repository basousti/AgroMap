const mongoDB = require("../configuration/dbconfig");

const TokenSchema = new mongoDB.Schema({
    email: { type: String},
    verificationCode: { type: String, default: null },  
    verificationExpires: { type: Number, default: null }
});

// Make sure the export is correct
module.exports = mongoDB.model("VerificationToken", TokenSchema);


//when "message": "VerificationToken validation failed: email: Path email is required."} means that you are requiring email 