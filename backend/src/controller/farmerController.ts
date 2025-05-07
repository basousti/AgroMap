import { Request, Response } from 'express';
import mongoose from 'mongoose';
import * as farmerService from '../services/farmerService';

// 🔐 Simulated auth for development
const getUserId = (req: Request): string => {
  return (req.headers['x-user-id'] as string) || 'mock-user-id';
};

// 📄 Get all farmers (with pagination and sorting)
export const getAllFarmersController = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortField as string) || 'name';
    const sortOrder = parseInt(req.query.sortOrder as string) as 1 | -1 || 1;

    const result = await farmerService.getAllFarmers(userId, page, limit, sortField, sortOrder);

    res.status(200).json({
      success: true,
      ...result,
    });

  } catch (error) {
    console.error('Erreur de récupération des agriculteurs:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// 🔍 Get farmer by ID
export const getFarmerByIdController = async (req: Request, res: Response) => {
  try {
    const farmer = await farmerService.getFarmerById(req.params.id);

    if (!farmer) {
      return res.status(404).json({ success: false, error: 'Agriculteur non trouvé' });
    }

    res.status(200).json({ success: true, data: farmer });

  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

// ➕ Create new farmer
export const createFarmerController = async (req: Request, res: Response) => {
  try {
    const createdBy = getUserId(req);
    const farmerData = { ...req.body, createdBy };

    const result = await farmerService.createFarmer(farmerData);

    res.status(201).json({ success: true, data: result });

  } catch (error) {
    console.error('Erreur création farmer:', error);
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// ✏️ Update farmer
export const updateFarmerController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'ID invalide' });
    }

    const updated = await farmerService.updateFarmer(id, req.body);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Agriculteur non trouvé' });
    }

    res.status(200).json({ success: true, data: updated });

  } catch (error) {
    res.status(400).json({ success: false, error: (error as Error).message });
  }
};

// ❌ Delete farmer
export const deleteFarmerController = async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'ID invalide' });
  }

  try {
    const deleted = await farmerService.deleteFarmer(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Agriculteur non trouvé' });
    }

    res.status(200).json({ success: true, message: 'Agriculteur supprimé avec succès' });

  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};

// 🔎 Search farmers
export const searchFarmersController = async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const query = req.query.q as string || '';

    const results = await farmerService.searchFarmers(query, userId);

    res.status(200).json({ success: true, data: results });

  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
};



// import { Request, Response } from 'express';
// import Farmer from '../models/farmer'; 
// import * as farmerService from '../services/farmerService';
// import mongoose from 'mongoose';


// // Middleware d'exemple pour récupérer l'utilisateur (à adapter si vous avez une auth)
// const getUserId = (req: Request): string => {
//   return req.headers['x-user-id'] as string || 'mock-user-id';
// };

// // Récupérer tous les agriculteurs
// export const getAllFarmersController = async (req: Request, res: Response) => {
//   try {
//     const farmers = await Farmer.find();

//     // Vérifier si des agriculteurs existent
//     if (farmers.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'Aucun agriculteur trouvé'
//       });
//     }

//     // Assurez-vous que la réponse contient un tableau de farmers
//     res.status(200).json({
//       success: true,
//       data: farmers, // Ceci doit être un tableau
//     });
//   } catch (error) {
//     console.error('Erreur lors de la récupération des agriculteurs:', error);
//     res.status(500).json({
//       success: false,
//       error: 'Erreur serveur lors de la récupération des agriculteurs',
//     });
//   }
// };


// // Récupérer un agriculteur par ID
// export const getFarmerByIdController = async (req: Request, res: Response) => {
//   try {
//     const farmer = await farmerService.getFarmerById(req.params.id);//farmerService.findOne(req.param.CIN)

//     if (!farmer) {
//       return res.status(404).json({
//         success: false,
//         error: 'Agriculteur non trouvé',
//       });
//     }

//     res.json(farmer);
//   } catch (error) {
//     res.status(400).json({ error: (error as Error).message });
//   } 
// };

// // Créer un nouvel agriculteur
// export const createFarmerController = async (req: Request, res: Response) => {
//   try{
//     const newFarmer = new Farmer({
//       ...req.body,
//       createdBy:new mongoose.Types.ObjectId(),
//     });
//     const savedFarmer = await newFarmer.save();
//     res.status(201).json(savedFarmer);

//   }catch(error: any){
//     res.status(500).json({error : error.message});

//   }
//   console.log("✅ Nouveau farmer reçu :", req.body);

// };

// // Mettre à jour un agriculteur
// export const updateFarmerController = async (req: Request, res: Response) => {
//   try {
//     const {id} = req.params;

//     //verifier si L'ID est valide
//     if(!mongoose.Types.ObjectId.isValid(id)){
//       return res.status(400).json({message: 'ID invalide'});
//     }

//     //Appeler le service pour mettre à jour l'agriculteur
//     const updated = await farmerService.updateFarmer(id, req.body);

//     //verifier si l'agriculteur a été trouvé 
//     if(!updated){
//       return res.status(404).json({message: 'Agroiculteur non trouvé '})
//     }

//     res.json(updated);
//   }catch(error){
//     res.status(400).json({error: (error as Error).message})
//   }
// };

// // Supprimer un agriculteur
// export const deleteFarmerController = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   if(!mongoose.Types.ObjectId.isValid(id)){
//     return res.status(400).json({message: 'ID invalide'});

//   }
//   try {
//     const deleted = await farmerService.deleteFarmer(id);
//     if (!deleted) {
//       return res.status(404).json({ message: 'Agriculteur non trouvé' });
//     }
//     res.json({message: 'Agriculteur supprimé avec succés'});
//   } catch (error) {
//     res.status(500).json({ error: (error as Error).message });
//   }
// };

// // Rechercher des agriculteurs
// export const searchFarmersController = async (req: Request, res: Response) => {
//   try {
//     const userId = getUserId(req);
//     const results = await farmerService.searchFarmers(req.query.q as string || '', userId);
//     res.json(results);
//   } catch (error) {
//     res.status(500).json({ error: (error as Error).message });
//   }
// };
