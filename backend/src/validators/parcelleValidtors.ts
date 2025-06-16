import { body, param, query, ValidationChain } from 'express-validator';

// ==================== VALIDATIONS DE BASE ====================

/**
 * Validation pour la création d'une parcelle
 */
export const creerParcelleValidation: ValidationChain[] = [
  body('nom')
    .trim()
    .notEmpty()
    .withMessage('Le nom de la parcelle est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

  body('culture')
    .trim()
    .notEmpty()
    .withMessage('Le type de culture est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('La culture doit contenir entre 2 et 50 caractères'),

  body('type')
    .optional()
    .isIn([
      'Résidentiel', 'Commercial', 'Industriel', 'Agricole', 'Touristique', 'Mixte',
      'agricole', 'irrigue', 'maraicher', 'arboriculture', 'elevage',
      'pluvial', 'serre', 'tunnel', 'plein_champ'
    ])
    .withMessage('Type de parcelle invalide'),

  body('statut')
    .optional()
    .isIn(['active', 'repos', 'preparation', 'inactive', 'en_preparation', 'en_repos'])
    .withMessage('Statut invalide'),

  body('superficie')
    .notEmpty()
    .withMessage('La superficie est requise')
    .matches(/^\d+(\.\d+)?\s*(m2|m²|hectares?|ha)?$/i)
    .withMessage('Format de superficie invalide'),

  body('latitude')
    .isFloat({ min: 30.0, max: 37.5 })
    .withMessage('Latitude doit être entre 30.0 et 37.5 (limites de la Tunisie)'),

  body('longitude')
    .isFloat({ min: 7.0, max: 12.0 })
    .withMessage('Longitude doit être entre 7.0 et 12.0 (limites de la Tunisie)'),

  body('farmerId')
    .trim()
    .notEmpty()
    .withMessage('L\'ID de l\'agriculteur est requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('L\'ID agriculteur doit contenir entre 2 et 50 caractères'),

  body('farmerName')
    .trim()
    .notEmpty()
    .withMessage('Le nom de l\'agriculteur est requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de l\'agriculteur doit contenir entre 2 et 100 caractères'),

  body('montantInvestissement')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le montant d\'investissement doit être positif'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),

  body('formeType')
    .optional()
    .isIn(['polygon', 'rectangle', 'circle', 'marker'])
    .withMessage('Type de forme invalide'),

  body('surfaceTotale')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La surface totale doit être positive'),

  body('drawnParcels')
    .optional()
    .isArray({ max: 50 })
    .withMessage('Maximum 50 parcelles dessinées autorisées')
];

/**
 * Validation pour la mise à jour d'une parcelle
 */
export const mettreAJourParcelleValidation: ValidationChain[] = [
  param('id')
    .isMongoId()
    .withMessage('ID de parcelle invalide'),

  body('nom')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),

  body('culture')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La culture doit contenir entre 2 et 50 caractères'),

  body('type')
    .optional()
    .isIn([
      'Résidentiel', 'Commercial', 'Industriel', 'Agricole', 'Touristique', 'Mixte',
      'agricole', 'irrigue', 'maraicher', 'arboriculture', 'elevage',
      'pluvial', 'serre', 'tunnel', 'plein_champ'
    ])
    .withMessage('Type de parcelle invalide'),

  body('statut')
    .optional()
    .isIn(['active', 'repos', 'preparation', 'inactive', 'en_preparation', 'en_repos'])
    .withMessage('Statut invalide'),

  body('superficie')
    .optional()
    .matches(/^\d+(\.\d+)?\s*(m2|m²|hectares?|ha)?$/i)
    .withMessage('Format de superficie invalide'),

  body('latitude')
    .optional()
    .isFloat({ min: 30.0, max: 37.5 })
    .withMessage('Latitude doit être entre 30.0 et 37.5'),

  body('longitude')
    .optional()
    .isFloat({ min: 7.0, max: 12.0 })
    .withMessage('Longitude doit être entre 7.0 et 12.0'),

  body('farmerId')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('L\'ID agriculteur doit contenir entre 2 et 50 caractères'),

  body('farmerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom de l\'agriculteur doit contenir entre 2 et 100 caractères'),

  body('montantInvestissement')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Le montant d\'investissement doit être positif'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La description ne peut pas dépasser 500 caractères'),

  body('surfaceTotale')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('La surface totale doit être positive')
];

/**
 * Validation pour l'ID de parcelle
 */
export const parcelleIdValidation: ValidationChain[] = [
  param('id')
    .isMongoId()
    .withMessage('ID de parcelle invalide')
];

/**
 * Validation pour l'ID d'agriculteur
 */
export const farmerIdValidation: ValidationChain[] = [
  param('farmerId')
    .trim()
    .notEmpty()
    .withMessage('ID d\'agriculteur requis')
    .isLength({ min: 2, max: 50 })
    .withMessage('ID d\'agriculteur invalide')
];

// ==================== VALIDATIONS DE RECHERCHE ====================

/**
 * Validation pour la recherche par proximité
 */
export const rechercheProximiteValidation: ValidationChain[] = [
  query('latitude')
    .isFloat({ min: 30.0, max: 37.5 })
    .withMessage('Latitude doit être entre 30.0 et 37.5'),

  query('longitude')
    .isFloat({ min: 7.0, max: 12.0 })
    .withMessage('Longitude doit être entre 7.0 et 12.0'),

  query('rayon')
    .optional()
    .isFloat({ min: 0.1, max: 500 })
    .withMessage('Rayon doit être entre 0.1 et 500 km')
];

/**
 * Validation pour la recherche textuelle
 */
export const rechercheTexteValidation: ValidationChain[] = [
  query('q')
    .trim()
    .notEmpty()
    .withMessage('Terme de recherche requis')
    .isLength({ min: 2, max: 100 })
    .withMessage('Le terme de recherche doit contenir entre 2 et 100 caractères')
];

/**
 * ✅ NOUVEAU: Validation pour les filtres avancés
 */
export const filtresAvancesValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page doit être un entier positif'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limite doit être entre 1 et 1000'),

  query('sortBy')
    .optional()
    .isIn([
      'nom', 'culture', 'type', 'statut', 'superficie', 'farmerId', 'farmerName',
      'montantInvestissement', 'surfaceTotale', 'dateCreation', 'createdAt', 'updatedAt'
    ])
    .withMessage('Champ de tri invalide'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide (asc ou desc)'),

  query('culture')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Culture invalide'),

  query('statut')
    .optional()
    .isIn(['active', 'repos', 'preparation', 'inactive', 'en_preparation', 'en_repos'])
    .withMessage('Statut invalide'),

  query('farmerId')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('ID agriculteur invalide'),

  query('farmerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nom agriculteur invalide'),

  query('type')
    .optional()
    .isIn([
      'Résidentiel', 'Commercial', 'Industriel', 'Agricole', 'Touristique', 'Mixte',
      'agricole', 'irrigue', 'maraicher', 'arboriculture', 'elevage',
      'pluvial', 'serre', 'tunnel', 'plein_champ'
    ])
    .withMessage('Type invalide'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Terme de recherche invalide'),

  // ✅ NOUVEAUX FILTRES NUMÉRIQUES
  query('superficieMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Superficie minimale doit être positive'),

  query('superficieMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Superficie maximale doit être positive'),

  query('investissementMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Investissement minimal doit être positif'),

  query('investissementMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Investissement maximal doit être positif'),

  // ✅ FILTRES DE DATE
  query('dateCreationDebut')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide (format ISO 8601 requis)'),

  query('dateCreationFin')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide (format ISO 8601 requis)'),

  // ✅ FILTRES GÉOGRAPHIQUES
  query('latitude')
    .optional()
    .isFloat({ min: 30.0, max: 37.5 })
    .withMessage('Latitude doit être entre 30.0 et 37.5'),

  query('longitude')
    .optional()
    .isFloat({ min: 7.0, max: 12.0 })
    .withMessage('Longitude doit être entre 7.0 et 12.0'),

  query('rayon')
    .optional()
    .isFloat({ min: 0.1, max: 500 })
    .withMessage('Rayon doit être entre 0.1 et 500 km')
];

/**
 * Validation pour la pagination
 */
export const paginationValidation: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page doit être un entier positif'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Limite doit être entre 1 et 1000'),

  query('sortBy')
    .optional()
    .isIn(['nom', 'culture', 'type', 'statut', 'superficie', 'farmerId', 'dateCreation', 'createdAt'])
    .withMessage('Champ de tri invalide'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordre de tri invalide')
];

// ==================== VALIDATIONS UTILITAIRES ====================

/**
 * Validation pour les coordonnées
 */
export const coordonneesValidation: ValidationChain[] = [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude doit être entre -90 et 90'),

  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude doit être entre -180 et 180')
];

/**
 * Validation pour le calcul de distance
 */
export const calculDistanceValidation: ValidationChain[] = [
  body('lat1')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude 1 invalide'),

  body('lng1')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude 1 invalide'),

  body('lat2')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude 2 invalide'),

  body('lng2')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude 2 invalide')
];

// ==================== NOUVELLES VALIDATIONS ====================

/**
 * ✅ NOUVEAU: Validation pour la suppression multiple
 */
export const suppressionMultipleValidation: ValidationChain[] = [
  body('ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('Liste d\'IDs requise (entre 1 et 100 éléments)'),

  body('ids.*')
    .isMongoId()
    .withMessage('Chaque ID doit être un ObjectId MongoDB valide'),

  body('force')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre force doit être un booléen')
];

/**
 * ✅ NOUVEAU: Validation pour la mise à jour de statut multiple
 */
export const miseAJourStatutMultipleValidation: ValidationChain[] = [
  body('ids')
    .isArray({ min: 1, max: 100 })
    .withMessage('Liste d\'IDs requise (entre 1 et 100 éléments)'),

  body('ids.*')
    .isMongoId()
    .withMessage('Chaque ID doit être un ObjectId MongoDB valide'),

  body('statut')
    .isIn(['active', 'repos', 'preparation'])
    .withMessage('Statut invalide (active, repos ou preparation)')
];

/**
 * ✅ CORRIGÉ: Validation pour les filtres par range
 */
export const filtresRangeValidation: ValidationChain[] = [
  query('superficieMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Superficie minimale doit être positive'),

  query('superficieMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Superficie maximale doit être positive')
    .custom((value, { req }) => {
      const query = req?.query;
      if (query?.superficieMin && parseFloat(value) < parseFloat(query.superficieMin as string)) {
        throw new Error('La superficie maximale doit être supérieure à la minimale');
      }
      return true;
    }),

  query('investissementMin')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Investissement minimal doit être positif'),

  query('investissementMax')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Investissement maximal doit être positif')
    .custom((value, { req }) => {
      const query = req?.query;
      if (query?.investissementMin && parseFloat(value) < parseFloat(query.investissementMin as string)) {
        throw new Error('L\'investissement maximal doit être supérieur au minimal');
      }
      return true;
    })
];

/**
 * ✅ CORRIGÉ: Validation pour les filtres de date
 */
export const filtresDateValidation: ValidationChain[] = [
  query('dateCreationDebut')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide (format ISO 8601 requis)'),

  query('dateCreationFin')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide (format ISO 8601 requis)')
    .custom((value, { req }) => {
      const query = req?.query;
      if (query?.dateCreationDebut && new Date(value) < new Date(query.dateCreationDebut as string)) {
        throw new Error('La date de fin doit être postérieure à la date de début');
      }
      return true;
    })
];

/**
 * ✅ NOUVEAU: Validation pour l'export de données
 */
export const exportValidation: ValidationChain[] = [
  query('format')
    .optional()
    .isIn(['csv', 'excel', 'json'])
    .withMessage('Format d\'export invalide (csv, excel ou json)'),

  query('colonnes')
    .optional()
    .isArray()
    .withMessage('Les colonnes doivent être un tableau'),

  query('colonnes.*')
    .optional()
    .isIn([
      'nom', 'parcelleNom', 'farmerName', 'farmerId', 'culture', 'type', 'statut',
      'superficie', 'latitude', 'longitude', 'montantInvestissement', 'description',
      'surfaceTotale', 'createdAt', 'updatedAt'
    ])
    .withMessage('Colonne invalide pour l\'export')
];

/**
 * ✅ NOUVEAU: Validation pour l'import de données
 */
export const importValidation: ValidationChain[] = [
  body('donnees')
    .isArray({ min: 1, max: 1000 })
    .withMessage('Données d\'import requises (entre 1 et 1000 éléments)'),

  body('modeImport')
    .optional()
    .isIn(['creation', 'mise_a_jour', 'upsert'])
    .withMessage('Mode d\'import invalide'),

  body('ignoreErreurs')
    .optional()
    .isBoolean()
    .withMessage('Le paramètre ignoreErreurs doit être un booléen')
];