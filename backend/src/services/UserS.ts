const Employe = require("../models/employe");
const Users = require("../models/users");

async function getUsers() {
  // Step 1: Get all employe documents with 'pending' state
  const employers = await Employe.find({ state: "pending" });

  // Step 2: Extract user IDs from employers
  const userIds = employers.map((emp:any) => emp._id);

  // Step 3: Get user documents
  const users = await Users.find({ _id: { $in: userIds } });

  // Step 4: Merge selected fields
  const result = users.map((user:any) => {
    const employer = employers.find((emp:any) => emp._id.toString() === user._id.toString());
    return {
      matriculate: employer?.matriculate,
      name: user.name,
      prenom: user.prenom,
      email: user.email,
    };
  });

  return result; 
}

module.exports = { getUsers };






// //get users API
// //this file read users fro db
// const employe = require("../models/employe");
// const user = require("../models/users");

// async function getUsers() {
//     // Step 1: Get all employers with pending state
//     const employers = await employe.find({ state: "pending" });
   
//     // Step 2: Extract _id list (these are user IDs)
//     const userIds = employers.map((emp: any) => emp._id);
  
//     // Step 3: Find users whose _id is in userIds
//     return await user.find({ _id: { $in: userIds } });
//   }

// module.exports = { getUsers };
