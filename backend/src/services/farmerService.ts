const bcrypt =require('bcrypt') ; 
import mongoose from "mongoose";
const Farmer =require('../models/farmer') ;          
const User =require('../models/users') ;

interface FarmerInput {
  _id: mongoose.Types.ObjectId;
  name: string;
  prenom: string;
  email: string;
  localite: string;
  telephone: string;
  adresse: string;
}

// 🧑‍🌾 Get all farmers with pagination
export const getAllFarmers = async (
  page = 1,
  limit = 10,
  sortField = 'localite',
  sortOrder: 1 | -1 = 1
) => {
  const skip = (page - 1) * limit;
  const sort: Record<string, 1 | -1> = { [sortField]: sortOrder };

  // Find farmers with user populated, filtered by role 'agriculteur'
  const [farmers, total] = await Promise.all([
    Farmer.find()
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate({
          path: '_id',
          select: 'name prenom email role', // ✅ ajout de "email"
          match: { role: 'agriculteur' },
        }),

    Farmer.countDocuments(),
  ]);

  // Filter out farmers whose user was not matched (no role or missing)
  const filteredFarmers = farmers.filter((farmer: { _id: any }) => farmer._id !== null);
  return {
    farmers: filteredFarmers,
    pagination: {
      total: filteredFarmers.length,
      page,
      limit,
      pages: Math.ceil(filteredFarmers.length / limit),
    },
  };
};


// 🔎 Get a farmer by ID
export const getFarmerById = async (id: string) => {
  if (!User.Types.ObjectId.isValid(id)) {
    throw new Error("ID d'agriculteur invalide");
  }

  return await Farmer.findById(id).populate('_id', 'name prenom email');
};


// Create a user + farmer
export const createFarmer = async (data: FarmerInput) => {
  try {
    const { name, prenom, email, localite, telephone, adresse } = data;

    // Check if email already used
    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email déjà utilisé.');

    // Encrypt the password
    // const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const newUser = new User({
      name,
      prenom,
      email,
      // password: hashedPassword,
      role: 'agriculteur',
    });

    const savedUser = await newUser.save();

    // Create the farmer linked to the user
    const newFarmer = new Farmer({
      _id: savedUser._id, // Link farmer to user
      localite,
      telephone,
      adresse,
      state: 'actif',
    });

    const savedFarmer = await newFarmer.save();

    return { user: savedUser, farmer: savedFarmer };
  } catch (err: any) {
    throw new Error(`Erreur création farmer: ${err.message}`);
  }
};



// ✏️ Update farmer
export const updateFarmer = async (id: string, updateData: any) => {
  // Convert string ID to ObjectId if needed
  const objectId = new mongoose.Types.ObjectId(id);
  
  const updated = await Farmer.findOneAndUpdate(
    { _id: objectId },
    updateData,
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new Error("Agriculteur non trouvé");
  }

  // Optionally update the linked user document
  if (updated._id) { // Reference to user document
    await User.findByIdAndUpdate(
      updated._id,
      {
        name: updateData.name,
        prenom: updateData.prenom,
        email: updateData.email
      }
    );
  }

  return updated;
};

// ❌ Delete farmer
export const deleteFarmer = async (id: string) => {
  console.log("Deleting farmer with ID:", id); // Debug log
  
  // Convert to string if it's an ObjectId
  const idString = String(id);
  
  if (!mongoose.Types.ObjectId.isValid(idString)) {
    console.error("Invalid ID format received:", idString);
    throw new Error(`Invalid ID format: ${idString}`);
  }

  const objectId = new mongoose.Types.ObjectId(idString);
  const farmer = await Farmer.findByIdAndDelete(objectId);

  if (!farmer) {
    throw new Error("Farmer not found");
  }

  return true;
};

// 
// export const deleteFarmer = async (id: string) => {
//   if (!User.Types.ObjectId.isValid(id)) {
//     throw new Error("ID d'agriculteur invalide for delete");
//   }

//   const farmer = await Farmer.findByIdAndDelete(id);
//   return !!farmer;
// };



// 🔍 Search farmers
export const searchFarmers = async (searchTerm: string, userId: string) => {
  const regex = new RegExp(searchTerm, 'i');

  return await Farmer.find({
    createdBy: userId,
    $or: [
      { localite: regex },
      { telephone: regex },
      { adresse: regex },
    ],
  }).populate('_id', 'name prenom email');
};
