import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import Parcelle from '../models/Parcelle';
import mongoose from 'mongoose';
 
export class ParcelleController {

  // ✅ CRÉER UNE NOUVELLE PARCELLE
  async creerParcelle(req: Request, res: Response): Promise<void> {
    try {
      // Vérifier les erreurs de validation
      const errors = validationResult(req);
      if (!errors.isEmpty() ) {
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
          
        });
        return;
      }

      console.log('🌾 Création d\'une nouvelle parcelle...');
      console.log('📋 Données reçues:', JSON.stringify(req.body, null, 2));

      const {
        nom,
        culture,
        type,
        statut,
        superficie,
        latitude,
        longitude,
        farmerId,
        farmerName,
        montantInvestissement,
        description,
        coordonnees,
        formeType,
        surfaceTotale,
        drawnParcels
      } = req.body;

      // ✅ Gestion du nom d'agriculteur
      let finalFarmerName = farmerName;
      let finalFarmerId = farmerId;

      if (!finalFarmerName && finalFarmerId) {
        finalFarmerName = finalFarmerId;
      }
      
      if (!finalFarmerId && !finalFarmerName) {
        finalFarmerId = `farmer_${Date.now()}`;
        finalFarmerName = 'Agriculteur inconnu';
      }

      if (!finalFarmerId && finalFarmerName) {
        finalFarmerId = finalFarmerName.toLowerCase().replace(/\s+/g, '_');
      }


      const donneesNettoyees = {
        nom: nom?.trim(),
        culture: culture?.toLowerCase()?.trim(),
        type: type || 'plein_champ',
        statut: statut || 'active',
        superficie: superficie?.toString() || '0',
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
        farmerId: finalFarmerId,
        farmerName: finalFarmerName,
        montantInvestissement: parseFloat(montantInvestissement) || 0,
        description: description?.trim() || '',
        coordonnees: coordonnees || null,
        formeType: formeType || 'marker',
        surfaceTotale: parseFloat(surfaceTotale) || null,
        drawnParcels: drawnParcels || []
      };

      console.log('🔧 Données nettoyées:', donneesNettoyees);

      // Validations manuelles
      if (!donneesNettoyees.nom) {
        res.status(400).json({
          success: false,
          error: 'Le nom de la parcelle est requis'
        });
        return;
      }

      if (!donneesNettoyees.culture) {
        res.status(400).json({
          success: false,
          error: 'Le type de culture est requis'
        });
        return;
      }

      if (!donneesNettoyees.farmerName) {
        res.status(400).json({
          success: false,
          error: 'Le nom de l\'agriculteur est requis'
        });
        return;
      }

      // Créer la parcelle
      const nouvelleParcelle = new Parcelle(donneesNettoyees);
      const parcelleSauvegardee = await nouvelleParcelle.save();

      console.log('✅ Parcelle sauvegardée avec ID:', parcelleSauvegardee._id);

      // Formatage pour le frontend
      const parcelleFormatee = {
        id: parcelleSauvegardee._id,
        _id: parcelleSauvegardee._id,
        nom: parcelleSauvegardee.farmerName,
        parcelleNom: parcelleSauvegardee.nom,
        farmerName: parcelleSauvegardee.farmerName,
        farmerId: parcelleSauvegardee.farmerId,
        latitude: parcelleSauvegardee.latitude,
        longitude: parcelleSauvegardee.longitude,
        superficie: parcelleSauvegardee.superficie,
        type: parcelleSauvegardee.type,
        statut: parcelleSauvegardee.statut,
        culture: parcelleSauvegardee.culture,
        montantInvestissement: parcelleSauvegardee.montantInvestissement,
        description: parcelleSauvegardee.description,
        coordonnees: parcelleSauvegardee.coordonnees,
        formeType: parcelleSauvegardee.formeType,
        surfaceTotale: parcelleSauvegardee.surfaceTotale,
        drawnParcels: parcelleSauvegardee.drawnParcels,
        createdAt: parcelleSauvegardee.createdAt,
        updatedAt: parcelleSauvegardee.updatedAt,
        displayId: parcelleSauvegardee._id.toString().slice(-6)
      };

      res.status(201).json({
        success: true,
        message: 'Parcelle créée avec succès',
        data: parcelleFormatee
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la création de la parcelle:', error);

      if (error.name === 'ValidationError') {
        const erreurs = Object.values(error.errors).map((err: any) => ({
          champ: err.path,
          message: err.message,
          valeur: err.value
        }));

        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: erreurs
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la création de la parcelle',
        details: error.message
      });
    }
  }

  // ✅ OBTENIR TOUTES LES PARCELLES
  async obtenirParcelles(req: Request, res: Response): Promise<void> {
    try {
    
      const {
        page = 1,
        limit = 100,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        culture,
        statut,
        farmerId,
        farmerName,
        type,
        search
      } = req.query;

      // Construction du filtre
      const filtre: any = {};
      
      if (culture) filtre.culture = culture;
      if (statut) filtre.statut = statut;
      if (farmerId) filtre.farmerId = farmerId;
      if (farmerName) filtre.farmerName = new RegExp(farmerName as string, 'i');
      if (type) filtre.type = type;
      
      // Recherche textuelle
      if (search) {
        filtre.$or = [
          { nom: new RegExp(search as string, 'i') },
          { farmerName: new RegExp(search as string, 'i') },
          { culture: new RegExp(search as string, 'i') },
          { farmerId: new RegExp(search as string, 'i') }
        ];
      }

      // Options de tri
      const sortOptions: any = {};
      sortOptions[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      // Pagination
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Requête avec pagination
      const [parcelles, total] = await Promise.all([
        Parcelle.find(filtre)
          .sort(sortOptions)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Parcelle.countDocuments(filtre)
      ]);

      // Formatage pour le frontend
      const parcellesFormatees = parcelles.map(parcelle => ({
        id: parcelle._id,
        _id: parcelle._id,
        nom: parcelle.farmerName || parcelle.farmerId || 'Agriculteur inconnu',
        parcelleNom: parcelle.nom,
        farmerName: parcelle.farmerName,
        farmerId: parcelle.farmerId,
        latitude: parcelle.latitude,
        longitude: parcelle.longitude,
        superficie: parcelle.superficie,
        type: parcelle.type,
        statut: parcelle.statut,
        culture: parcelle.culture,
        montantInvestissement: parcelle.montantInvestissement || 0,
        description: parcelle.description,
        coordonnees: parcelle.coordonnees,
        formeType: parcelle.formeType,
        surfaceTotale: parcelle.surfaceTotale,
        drawnParcels: parcelle.drawnParcels || [],
        createdAt: parcelle.createdAt,
        updatedAt: parcelle.updatedAt,
        displayId: parcelle._id.toString().slice(-6)
      }));

       res.status(200).json({
        success: true,
        message: 'Parcelles récupérées avec succès',
        data: parcellesFormatees,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum)
        }
      });


    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des parcelles:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des parcelles',
        details: error.message
      });
    }
  }

  // ✅ OBTENIR UNE PARCELLE PAR ID
  async obtenirParcelleParId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'ID invalide',
          details: errors.array()
        });
        return;
      }

      const { id } = req.params;
      console.log(`📊 Récupération de la parcelle ${id}...`);

      const parcelle = await Parcelle.findById(id);

      if (!parcelle) {
        res.status(404).json({
          success: false,
          error: 'Parcelle non trouvée'
        });
        return;
      }

      // Formatage pour le frontend
      const parcelleFormatee = {
        id: parcelle._id,
        _id: parcelle._id,
        nom: parcelle.farmerName || parcelle.farmerId || 'Agriculteur inconnu',
        parcelleNom: parcelle.nom,
        farmerName: parcelle.farmerName,
        farmerId: parcelle.farmerId,
        latitude: parcelle.latitude,
        longitude: parcelle.longitude,
        superficie: parcelle.superficie,
        type: parcelle.type,
        statut: parcelle.statut,
        culture: parcelle.culture,
        montantInvestissement: parcelle.montantInvestissement,
        description: parcelle.description,
        coordonnees: parcelle.coordonnees,
        formeType: parcelle.formeType,
        surfaceTotale: parcelle.surfaceTotale,
        drawnParcels: parcelle.drawnParcels,
        createdAt: parcelle.createdAt,
        updatedAt: parcelle.updatedAt,
        displayId: parcelle._id.toString().slice(-6)
      };

      res.status(200).json({
        success: true,
        data: parcelleFormatee
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération de la parcelle:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de la parcelle',
        details: error.message
      });
    }
  }

  // ✅ METTRE À JOUR UNE PARCELLE
  async mettreAJourParcelle(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: errors.array()
        });
        return;
      }

      const { id } = req.params;
      
      if (!mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'ID de parcelle invalide'
        });
        return;
      }

      console.log(`🔧 Mise à jour de la parcelle ${id}...`);

      // Vérifier que la parcelle existe
      const parcelleExistante = await Parcelle.findById(id);
      if (!parcelleExistante) {
        res.status(404).json({
          success: false,
          error: 'Parcelle non trouvée'
        });
        return;
      }

      // S'assurer que farmerName est géré
      if (req.body.farmerId && !req.body.farmerName) {
        req.body.farmerName = req.body.farmerId;
      }

      const parcelleMiseAJour = await Parcelle.findByIdAndUpdate(
        id,
        { ...req.body, updatedAt: new Date() },
        { new: true, runValidators: true, context: 'query' }
      );

      if (!parcelleMiseAJour) {
        res.status(404).json({
          success: false,
          error: 'Parcelle non trouvée'
        });
        return;
      }

      console.log('✅ Parcelle mise à jour:', parcelleMiseAJour.farmerName);

      // Formatage pour le frontend
      const parcelleFormatee = {
        id: parcelleMiseAJour._id,
        _id: parcelleMiseAJour._id,
        nom: parcelleMiseAJour.farmerName || parcelleMiseAJour.farmerId,
        parcelleNom: parcelleMiseAJour.nom,
        farmerName: parcelleMiseAJour.farmerName,
        farmerId: parcelleMiseAJour.farmerId,
        latitude: parcelleMiseAJour.latitude,
        longitude: parcelleMiseAJour.longitude,
        superficie: parcelleMiseAJour.superficie,
        type: parcelleMiseAJour.type,
        statut: parcelleMiseAJour.statut,
        culture: parcelleMiseAJour.culture,
        montantInvestissement: parcelleMiseAJour.montantInvestissement,
        description: parcelleMiseAJour.description,
        coordonnees: parcelleMiseAJour.coordonnees,
        formeType: parcelleMiseAJour.formeType,
        surfaceTotale: parcelleMiseAJour.surfaceTotale,
        drawnParcels: parcelleMiseAJour.drawnParcels,
        createdAt: parcelleMiseAJour.createdAt,
        updatedAt: parcelleMiseAJour.updatedAt,
        displayId: parcelleMiseAJour._id.toString().slice(-6)
      };

      res.status(200).json({
        success: true,
        message: 'Parcelle mise à jour avec succès',
        data: parcelleFormatee
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour de la parcelle:', error);
      
      if (error.name === 'ValidationError') {
        const erreurs = Object.values(error.errors).map((err: any) => ({
          champ: err.path,
          message: err.message,
          valeur: err.value
        }));

        res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: erreurs
        });
        return;
      }

      if (error.name === 'CastError') {
        res.status(400).json({
          success: false,
          error: 'Format de données invalide',
          details: error.message
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour de la parcelle',
        details: error.message
      });
    }
  }

  // ✅ SUPPRIMER UNE PARCELLE
  async supprimerParcelle(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'ID invalide',
          details: errors.array()
        });
        return;
      }

      const { id } = req.params;
      
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        res.status(400).json({
          success: false,
          error: 'ID de parcelle invalide ou manquant'
        });
        return;
      }

      console.log(`🗑️ Tentative de suppression de la parcelle ${id}...`);

      // Vérifier l'existence avant suppression
      const parcelleExistante = await Parcelle.findById(id);
      if (!parcelleExistante) {
        res.status(404).json({
          success: false,
          error: 'Parcelle non trouvée'
        });
        return;
      }

      // Vérifications métier
      const { force } = req.query;
      
      // if (!force && parcelleExistante.statut === 'active') {
      //   res.status(409).json({
      //     success: false,
      //     error: 'Parcelle active - Suppression non autorisée',
      //     message: 'Ajoutez ?force=true pour forcer la suppression',
      //     data: {
      //       id: parcelleExistante._id,
      //       nom: parcelleExistante.nom,
      //       statut: parcelleExistante.statut,
      //       farmerName: parcelleExistante.farmerName
      //     }
      //   });
      //   return;
      // }

      const parcelleSupprimee = await Parcelle.findByIdAndDelete(id);

      if (!parcelleSupprimee) {
        res.status(404).json({
          success: false,
          error: 'Parcelle introuvable lors de la suppression'
        });
        return;
      }

      console.log('✅ Parcelle supprimée avec succès:', {
        id: parcelleSupprimee._id,
        nom: parcelleSupprimee.nom,
        farmerName: parcelleSupprimee.farmerName
      });

      res.status(200).json({
        success: true,
        message: 'Parcelle supprimée avec succès',
        data: { 
          id: parcelleSupprimee._id,
          nom: parcelleSupprimee.nom,
          farmerName: parcelleSupprimee.farmerName
        }
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression de la parcelle:', error);
      
      if (error.name === 'CastError') {
        res.status(400).json({
          success: false,
          error: 'Format d\'ID invalide',
          details: 'L\'ID fourni n\'est pas un ObjectId MongoDB valide'
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression de la parcelle',
        details: error.message
      });
    }
  }

  // ✅ OBTENIR LES STATISTIQUES
  async obtenirStatistiques(req: Request, res: Response): Promise<void> {
    try {
      console.log('📊 Calcul des statistiques des parcelles...');

      const stats = await Parcelle.obtenirStatistiques();

      res.status(200).json({
        success: true,
        data: stats[0] || {
          totalParcelles: 0,
          parcellesActives: 0,
          superficieTotale: 0,
          investissementTotal: 0,
          nombreAgriculteurs: 0
        }
      });

    } catch (error: any) {
      console.error('❌ Erreur lors du calcul des statistiques:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul des statistiques',
        details: error.message
      });
    }
  }

  // ✅ OBTENIR LES CULTURES DISPONIBLES
  async obtenirCulturesDisponibles(req: Request, res: Response): Promise<void> {
    try {
      const cultures = await Parcelle.distinct('culture');
      
      res.status(200).json({
        success: true,
        data: cultures.sort()
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des cultures:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des cultures',
        details: error.message
      });
    }
  }

  // ✅ OBTENIR LES AGRICULTEURS DISPONIBLES
  async obtenirAgriculteursDisponibles(req: Request, res: Response): Promise<void> {
    try {
      const agriculteurs = await Parcelle.aggregate([
        {
          $group: {
            _id: '$farmerId',
            nom: { $first: '$farmerName' },
            nombreParcelles: { $sum: 1 },
            superficieTotale: { $sum: '$surfaceTotale' }
          }
        },
        {
          $sort: { nom: 1 }
        }
      ]);

      res.status(200).json({
        success: true,
        data: agriculteurs
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des agriculteurs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des agriculteurs',
        details: error.message
      });
    }
  }

  // ✅ RECHERCHER PAR TEXTE
  async rechercherParTexte(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Paramètres de recherche invalides',
          details: errors.array()
        });
        return;
      }

      const { q } = req.query;
      
      const parcelles = await Parcelle.find({
        $text: { $search: q as string }
      }, {
        score: { $meta: 'textScore' }
      }).sort({
        score: { $meta: 'textScore' }
      });

      // Formatage pour le frontend
      const parcellesFormatees = parcelles.map(parcelle => ({
        id: parcelle._id,
        nom: parcelle.farmerName || parcelle.farmerId,
        parcelleNom: parcelle.nom,
        farmerName: parcelle.farmerName,
        farmerId: parcelle.farmerId,
        culture: parcelle.culture,
        statut: parcelle.statut,
        superficie: parcelle.superficie
      }));

      res.status(200).json({
        success: true,
        data: parcellesFormatees
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la recherche:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche',
        details: error.message
      });
    }
  }

  // ✅ RECHERCHER PAR PROXIMITÉ
  async rechercherParProximite(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Paramètres de proximité invalides',
          details: errors.array()
        });
        return;
      }

      const { latitude, longitude, rayon = 10 } = req.query;

      const parcelles = await Parcelle.rechercherParProximite(
        parseFloat(latitude as string),
        parseFloat(longitude as string),
        parseFloat(rayon as string)
      );

      // Formatage pour le frontend
      const parcellesFormatees = parcelles.map(parcelle => ({
        id: parcelle._id,
        nom: parcelle.farmerName || parcelle.farmerId,
        parcelleNom: parcelle.nom,
        farmerName: parcelle.farmerName,
        latitude: parcelle.latitude,
        longitude: parcelle.longitude,
        culture: parcelle.culture,
        superficie: parcelle.superficie
      }));

      res.status(200).json({
        success: true,
        data: parcellesFormatees
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la recherche par proximité:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la recherche par proximité',
        details: error.message
      });
    }
  }

  // ✅ OBTENIR PARCELLES PAR FARMER ID
  async obtenirParcellesParFarmerId(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'ID agriculteur invalide',
          details: errors.array()
        });
        return;
      }

      const { farmerId } = req.params;

      const parcelles = await Parcelle.find({ farmerId }).sort({ createdAt: -1 });

      // Formatage pour le frontend
      const parcellesFormatees = parcelles.map(parcelle => ({
        id: parcelle._id,
        nom: parcelle.farmerName || parcelle.farmerId,
        parcelleNom: parcelle.nom,
        farmerName: parcelle.farmerName,
        farmerId: parcelle.farmerId,
        latitude: parcelle.latitude,
        longitude: parcelle.longitude,
        superficie: parcelle.superficie,
        culture: parcelle.culture,
        statut: parcelle.statut,
        montantInvestissement: parcelle.montantInvestissement
      }));

      res.status(200).json({
        success: true,
        data: parcellesFormatees
      });
      

    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des parcelles de l\'agriculteur:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des parcelles',
        details: error.message
      });
    }
  }

  // ✅ VALIDER COORDONNÉES
  async validerCoordonnees(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Coordonnées invalides',
          details: errors.array()
        });
        return;
      }

      const { latitude, longitude } = req.body;

      const valide = latitude >= 30.0 && latitude <= 37.5 && 
                    longitude >= 7.0 && longitude <= 12.0;

      res.status(200).json({
        success: true,
        data: {
          valide,
          latitude,
          longitude,
          message: valide ? 'Coordonnées valides pour la Tunisie' : 'Coordonnées hors des limites de la Tunisie'
        }
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la validation',
        details: error.message
      });
    }
  }



  // ✅ CALCULER DISTANCE
  async calculerDistance(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: 'Paramètres invalides',
          details: errors.array()
        });
        return;
      }

      const { lat1, lng1, lat2, lng2 } = req.body;

      // Formule de Haversine pour calculer la distance
      const R = 6371; // Rayon de la Terre en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      res.status(200).json({
        success: true,
        data: {
          distance: Math.round(distance * 1000) / 1000, // 3 décimales
          unite: 'km'
        }
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: 'Erreur lors du calcul de distance',
        details: error.message
      });
    }
  }

  // ✅ SUPPRIMER PLUSIEURS PARCELLES
  async supprimerPlusieurs(req: Request, res: Response): Promise<void> {
    try {
      const { ids, force } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Liste d\'IDs requise'
        });
        return;
      }

      // Validation des IDs
      const idsValides = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (idsValides.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Aucun ID valide fourni'
        });
        return;
      }

      console.log(`🗑️ Suppression multiple de ${idsValides.length} parcelles...`);

      // Vérification d'existence
      const parcellesExistantes = await Parcelle.find({ 
        _id: { $in: idsValides } 
      });

      if (parcellesExistantes.length === 0) {
        res.status(404).json({
          success: false,
          error: 'Aucune parcelle trouvée avec les IDs fournis'
        });
        return;
      }

      // Vérification métier si nécessaire
      if (!force) {
        const parcellesActives = parcellesExistantes.filter(p => p.statut === 'active');
        if (parcellesActives.length > 0) {
          res.status(409).json({
            success: false,
            error: `${parcellesActives.length} parcelle(s) active(s) - Suppression non autorisée`,
            message: 'Ajoutez "force": true pour forcer la suppression',
            data: {
              parcellesActives: parcellesActives.map(p => ({
                id: p._id,
                nom: p.nom,
                farmerName: p.farmerName
              }))
            }
          });
          return;
        }
      }

      // Suppression multiple
      const resultat = await Parcelle.deleteMany({ 
        _id: { $in: idsValides } 
      });

      console.log(`✅ ${resultat.deletedCount} parcelles supprimées sur ${idsValides.length} demandées`);

      res.status(200).json({
        success: true,
        message: `${resultat.deletedCount} parcelle(s) supprimée(s) avec succès`,
        data: {
          supprimees: resultat.deletedCount,
          demandees: idsValides.length
        }
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression multiple:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la suppression multiple',
        details: error.message
      });
    }
  }

  // ✅ METTRE À JOUR LE STATUT DE PLUSIEURS PARCELLES
  async mettreAJourStatutPlusieurs(req: Request, res: Response): Promise<void> {
    try {
      const { ids, statut } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Liste d\'IDs requise'
        });
        return;
      }

      if (!['active', 'repos', 'preparation', 'inactive', 'en_preparation', 'en_repos'].includes(statut)) {
        res.status(400).json({
          success: false,
          error: 'Statut invalide'
        });
        return;
      }

      // Validation des IDs
      const idsValides = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      console.log(`🔧 Mise à jour du statut de ${idsValides.length} parcelles vers "${statut}"...`);

      // Mise à jour multiple
      const resultat = await Parcelle.updateMany(
        { _id: { $in: idsValides } },
        { 
          statut: statut,
          updatedAt: new Date()
        }
      );

      console.log(`✅ ${resultat.modifiedCount} parcelles mises à jour`);

      res.status(200).json({
        success: true,
        message: `Statut mis à jour pour ${resultat.modifiedCount} parcelle(s)`,
        data: {
          modifiees: resultat.modifiedCount,
          nouveauStatut: statut
        }
      });

    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour multiple du statut:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la mise à jour du statut',
        details: error.message
      });
    }
  }
}