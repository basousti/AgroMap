import express, { Request, Response, NextFunction } from 'express';
// import {validateFarmer } from '../validators/farmerValidator';
import axios from 'axios';
import {
  getFarmerByIdController,
  updateFarmerController,
  deleteFarmerController,
  createFarmerController,
  getAllFarmersController
} from '../controller/farmerController';

const router = express.Router();

   //proxy vers L'API externe
   router.get('/proxy/farmers', async (req: Request ,res: Response)=>{
    try{
      const response = await axios.get('https://tonapi.com/farmers');
      res.json(response.data);
    }catch(error){
      console.error('Erreur lors de la requete proxy :', error);
      res.status(500).json({error:'Erreur lors de la récupération des données depuis TONAPI'})
    }
  });

  //Récupérer tous les agriculteurs

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await getAllFarmersController(req, res);
  } catch (error) {
    next(error);
  }
});
// Route pour créer un agriculteur 

router.post('/', async (req: Request,res:Response,next:NextFunction)=>{
  try{
    await createFarmerController(req,res);
  }catch(error){
    next(error);
  }
})

//Routes for a spécific farmer by ID

router.route('/:id')
  .get(async(req:Request,res:Response, next:NextFunction)=>{
    try{
      await getFarmerByIdController(req,res);
    }catch(error){
      next(error);
    }
  })
  .put(async(req:Request, res:Response,next : NextFunction)=> {
    try{
      await updateFarmerController(req,res);
    }catch(error){
      next(error);
    }
  })

  .delete(async(req: Request, res: Response, next:NextFunction)=> {
    try{
      await deleteFarmerController(req,res);
    }catch(error){
      next(error)
    }
  });

export default router;