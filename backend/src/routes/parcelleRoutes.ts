import { Router } from 'express';
import { ParcelleController } from '../controller/parcelleController';
import {
  creerParcelleValidation,
  mettreAJourParcelleValidation,
  parcelleIdValidation,
  farmerIdValidation,
  rechercheProximiteValidation,
  rechercheTexteValidation,
  paginationValidation,
  coordonneesValidation,
  calculDistanceValidation,
  suppressionMultipleValidation,
  miseAJourStatutMultipleValidation
} from '../validators/parcelleValidtors';

const router = Router();
const parcelleController = new ParcelleController();

// ==================== ROUTES SPÉCIFIQUES (AVANT LES ROUTES AVEC PARAMÈTRES) ====================

/**
 * @route   GET /api/parcelles/stats
 * @desc    Obtenir les statistiques des parcelles
 * @access  Public
 */
router.get(
  '/stats',
  parcelleController.obtenirStatistiques.bind(parcelleController)
);

/**
 * @route   GET /api/parcelles/cultures
 * @desc    Obtenir la liste des cultures disponibles
 * @access  Public
 */
router.get(
  '/cultures',
  parcelleController.obtenirCulturesDisponibles.bind(parcelleController)
);

/**
 * @route   GET /api/parcelles/agriculteurs
 * @desc    Obtenir la liste des agriculteurs disponibles
 * @access  Public
 */
router.get(
  '/agriculteurs',
  parcelleController.obtenirAgriculteursDisponibles.bind(parcelleController)
);

/**
 * @route   GET /api/parcelles/search
 * @desc    Rechercher des parcelles par texte
 * @access  Public
 * @query   q (terme de recherche)
 */
router.get(
  '/search',
  rechercheTexteValidation,
  parcelleController.rechercherParTexte.bind(parcelleController)
);

/**
 * @route   GET /api/parcelles/proximite
 * @desc    Rechercher des parcelles par proximité géographique
 * @access  Public
 * @query   latitude, longitude, rayon
 */
router.get(
  '/proximite',
  rechercheProximiteValidation,
  parcelleController.rechercherParProximite.bind(parcelleController)
);

/**
 * @route   POST /api/parcelles/valider-coordonnees
 * @desc    Valider des coordonnées pour la Tunisie
 * @access  Public
 */
router.post(
  '/valider-coordonnees',
  coordonneesValidation,
  parcelleController.validerCoordonnees.bind(parcelleController)
);

/**
 * @route   POST /api/parcelles/calculer-distance
 * @desc    Calculer la distance entre deux points
 * @access  Public
 */
router.post(
  '/calculer-distance',
  calculDistanceValidation,
  parcelleController.calculerDistance.bind(parcelleController)
);

/**
 * @route   DELETE /api/parcelles/bulk
 * @desc    Supprimer plusieurs parcelles
 * @access  Public
 * @body    { ids: string[], force?: boolean }
 */
router.delete(
  '/bulk',
  suppressionMultipleValidation,
  parcelleController.supprimerPlusieurs.bind(parcelleController)
);

/**
 * @route   PATCH /api/parcelles/bulk/statut
 * @desc    Mettre à jour le statut de plusieurs parcelles
 * @access  Public
 * @body    { ids: string[], statut: string }
 */
router.patch(
  '/bulk/statut',
  miseAJourStatutMultipleValidation,
  parcelleController.mettreAJourStatutPlusieurs.bind(parcelleController)
);

/**
 * @route   GET /api/parcelles/farmer/:farmerId
 * @desc    Obtenir les parcelles d'un agriculteur spécifique
 * @access  Public
 */
router.get(
  '/farmer/:farmerId',
  farmerIdValidation,
  parcelleController.obtenirParcellesParFarmerId.bind(parcelleController)
);

// ==================== ROUTES GÉNÉRIQUES ====================

/**
 * @route   POST /api/parcelles
 * @desc    Créer une nouvelle parcelle
 * @access  Public
 */
router.post(
  '/',
  creerParcelleValidation,
  parcelleController.creerParcelle.bind(parcelleController)
);

/**
 * @route   GET /api/parcelles
 * @desc    Obtenir toutes les parcelles avec pagination et filtres
 * @access  Public
 * @query   page, limit, sortBy, sortOrder, culture, statut, farmerId, farmerName, type, search
 */
router.get(
  '/',
  paginationValidation,
  parcelleController.obtenirParcelles.bind(parcelleController)
);

// ==================== ROUTES AVEC PARAMÈTRES ID (À LA FIN) ====================

/**
 * @route   GET /api/parcelles/:id
 * @desc    Obtenir une parcelle par ID
 * @access  Public
 */
router.get(
  '/:id',
  parcelleIdValidation,
  parcelleController.obtenirParcelleParId.bind(parcelleController)
);

/**
 * @route   PUT /api/parcelles/:id
 * @desc    Mettre à jour une parcelle
 * @access  Public
 * @query   force (optionnel pour forcer certaines modifications)
 */
router.put(
  '/:id',
  mettreAJourParcelleValidation,
  parcelleController.mettreAJourParcelle.bind(parcelleController)
);

/**
 * @route   DELETE /api/parcelles/:id
 * @desc    Supprimer une parcelle
 * @access  Public
 * @query   force (optionnel pour forcer la suppression)
 */
router.delete(
  '/:id',
  parcelleIdValidation,
  parcelleController.supprimerParcelle.bind(parcelleController)
);

export default router;