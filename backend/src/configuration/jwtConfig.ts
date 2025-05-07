// //npm i crypto ()
// Making secret codes (encryption).
// Making fingerprints for passwords (hashing).
// Checking if someone changed a message (signatures).

const Crypt = require("crypto")

// Generate a random secret key
const secretKey = Crypt.randomBytes(32).toString('hex');

module.exports= {secretKey}//secretKey exported as an object


// but "bycrip" is easier at use but crypto more secured 
// Turning passwords into fingerprints (hashes).
// Checking if a password is correct (compare).