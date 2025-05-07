import {body,  validationResult } from 'express-validator';
import { Response,Request,NextFunction } from 'express';
// import { createFarmerController } from '../controller/farmerController';


//Exemple de validation lors de la création d'un agriculteur 
export const validateFarmer = [
    body('nom').notEmpty().withMessage('le nom est requis'),
    body('prenom').notEmpty().withMessage('le prenom est requis'),
    body('localite').notEmpty().withMessage('localité est requis'),
    body('telephone').isMobilePhone(['fr-FR','en-US']).withMessage('Numéro de téléphone invalide'),
    body('adresse').notEmpty().withMessage('L\'adresse est requis'),
    body('createdBy').isMongoId().withMessage('ID d\'utilisateur invalide'),

    (req:Request, res:Response, next:NextFunction) => {
        const errors = validationResult(req);
        if(!errors.isEmpty()){
            return res.status(400).json({errors: errors.array()});
        }
        next();
    },
];