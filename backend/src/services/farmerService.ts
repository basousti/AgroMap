import mongoose from 'mongoose';
const bcrypt =require('bcrypt') ; 
const Farmer =require('../models/farmer') ;          
const User =require('../models/users') ;           // Utilisateur model

interface FarmerInput {
  name: string;
  prenom: string;
  email: string;
  password: string;
  localite: string;
  telephone: string;
  adresse: string;
}

// 🧑‍🌾 Get all farmers with pagination
export const getAllFarmers = async (
  userId: string,
  page = 1,
  limit = 10,
  sortField = 'name',
  sortOrder: 1 | -1 = 1
) => {
  const skip = (page - 1) * limit;
  const sort: any = {};
  sort[sortField] = sortOrder;

  const farmers = await Farmer.find({ createdBy: userId })
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('_id', 'name prenom email'); // populate Utilisateur data

  const total = await Farmer.countDocuments({ createdBy: userId });

  return {
    farmers,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

// 🔎 Get a farmer by ID
export const getFarmerById = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID d'agriculteur invalide");
  }

  return await Farmer.findById(id).populate('_id', 'name prenom email');
};

// ➕ Create a user + farmer
export const createFarmer = async (data: FarmerInput) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, prenom, email, password, localite, telephone, adresse } = data;

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) throw new Error('Email déjà utilisé.');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      prenom,
      email,
      password: hashedPassword,
      role: 'agriculteur',
    });

    const savedUser = await newUser.save({ session });

    const newFarmer = new Farmer({
      _id: savedUser._id,
      localite,
      telephone,
      adresse,
      state: 'inactif',
    });

    await newFarmer.save({ session });

    await session.commitTransaction();
    session.endSession();

    return { user: savedUser, farmer: newFarmer };

  } catch (err: any) {
    await session.abortTransaction();
    session.endSession();
    throw new Error(err.message);
  }
};

// ✏️ Update farmer
export const updateFarmer = async (id: string, updateData: any) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID d'agriculteur invalide");
  }

  return await Farmer.findByIdAndUpdate(id, updateData, {
    new: true,
    runValidators: true,
  });
};

// ❌ Delete farmer
export const deleteFarmer = async (id: string) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error("ID d'agriculteur invalide");
  }

  const farmer = await Farmer.findByIdAndDelete(id);
  return !!farmer;
};

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



// import Farmer from '../models/farmer'; 
// import mongoose from 'mongoose';
 
// // Récupérer tous les agriculteurs avec pagination
// export const getAllFarmers = async (userId: string, page = 1, limit = 10, sortField = 'nom', sortOrder = 1) => {
//   const skip = (page - 1) * limit;
//   const sort: any = {};
//   sort[sortField] = sortOrder;

//   const farmers = await Farmer.find({ createdBy: userId })
//     .sort(sort)
//     .skip(skip)
//     .limit(limit);

//   const total = await Farmer.countDocuments({ createdBy: userId });

//   return {
//     farmers,
//     pagination: {
//       total,
//       page,
//       limit,
//       pages: Math.ceil(total / limit),
//     },
//   };
// };

// // Récupérer un agriculteur par son ID
// export const getFarmerById = async (id: string) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new Error('ID d\'agriculteur invalide');
//   }

//   return await Farmer.findById(id);
// };

// // Créer un nouvel agriculteur
// export const createFarmer = async (farmerData: any) => {
//   const newFarmer = new Farmer(farmerData);
//   return await newFarmer.save();
// };

// // Mettre à jour un agriculteur existant
// export const updateFarmer = async (id: string, updateData: any) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new Error('ID d\'agriculteur invalide');
//   }

//   return await Farmer.findByIdAndUpdate(id, updateData, {
//     new: true,
//     runValidators: true,
//   });
// };

// // Supprimer un agriculteur
// export const deleteFarmer = async (id: string) => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new Error('ID d\'agriculteur invalide');
//   }

//   const farmer = await Farmer.findByIdAndDelete(id);
//   return !!farmer;
// };

// // Rechercher des agriculteurs par terme de recherche
// export const searchFarmers = async (searchTerm: string, userId: string) => {
//   const searchRegex = new RegExp(searchTerm, 'i');

//   return await Farmer.find({
//     createdBy: userId,
//     $or: [
//       { nom: searchRegex },
//       { prenom: searchRegex },
//       { localite: searchRegex },
//       { telephone: searchRegex },
//       { adresse: searchRegex },
//     ],
//   });
// };

 

