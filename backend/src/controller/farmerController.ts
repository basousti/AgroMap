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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortField = (req.query.sortField as string) || 'localite';
    const sortOrder = parseInt(req.query.sortOrder as string) as 1 | -1 || 1;

    const result = await farmerService.getAllFarmers(page, limit, sortField, sortOrder);

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
    
    console.log("Received ID:", id); // Add this for debugging
    
    // More comprehensive validation
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      console.error("Invalid ID received:", id);
      return res.status(400).json({ 
        success: false, 
        message: 'ID invalide',
        receivedId: id // Send back the problematic ID for debugging
      });
    }

    const updated = await farmerService.updateFarmer(id, req.body);

    if (!updated) {
      return res.status(404).json({ 
        success: false, 
        message: 'Agriculteur non trouvé' 
      });
    }

    res.status(200).json({ success: true, data: updated });

  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ 
      success: false, 
      error: (error as Error).message 
    });
  }
};

// ❌ Delete farmer
export const deleteFarmerController = async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log("Received delete request for ID:", id);

  try {
    // Additional validation
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ 
        success: false, 
        message: 'ID must be a string',
        receivedId: id
      });
    }

    const deleted = await farmerService.deleteFarmer(id);

    if (!deleted) {
      return res.status(404).json({ 
        success: false, 
        message: 'Farmer not found' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Farmer deleted successfully' 
    });

  } catch (error:any) {
    console.error("Delete error:", error);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

// // ❌ Delete farmer
// export const deleteFarmerController = async (req: Request, res: Response) => {
//   const { id } = req.params;

//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     return res.status(400).json({ success: false, message: 'ID invalide' });
//   }

//   try {
//     const deleted = await farmerService.deleteFarmer(id);

//     if (!deleted) {
//       return res.status(404).json({ success: false, message: 'Agriculteur non trouvé' });
//     }

//     res.status(200).json({ success: true, message: 'Agriculteur supprimé avec succès' });

//   } catch (error) {
//     res.status(500).json({ success: false, error: (error as Error).message });
//   }
// };

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