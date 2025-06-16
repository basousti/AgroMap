import Parcelle, { IParcelle, IParcelleDocument } from '../models/Parcelle';
import mongoose from 'mongoose';

export interface IParcelleQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  culture?: string;
  statut?: 'active' | 'repos' | 'preparation';
  farmerId?: string;
  farmerName?: string; // ✅ AJOUTÉ: Filtre par nom d'agriculteur
  type?: string;
  search?: string;
  // ✅ NOUVEAUX FILTRES AVANCÉS
  superficieMin?: number;
  superficieMax?: number;
  investissementMin?: number;
  investissementMax?: number;
  dateCreationDebut?: Date;
  dateCreationFin?: Date;
  latitude?: number;
  longitude?: number;
  rayon?: number;
}

export interface IPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface IParcelleStats {
  totalParcelles: number;
  parcellesParStatut: {
    active: number;
    repos: number;
    preparation: number;
  };
  parcellesParCulture: Record<string, number>;
  parcellesParType: Record<string, number>;
  surfaceTotaleParcelles: number;
  investissementTotal: number;
  moyenneInvestissementParParcelle: number;
}

// ✅ NOUVELLE INTERFACE POUR LES FILTRES AVANCÉS
export interface IFiltresAvances {
  cultures: string[];
  types: string[];
  agriculteurs: Array<{ farmerId: string; farmerName: string; nombreParcelles: number }>;
  statistiques: {
    superficieMin: number;
    superficieMax: number;
    investissementMin: number;
    investissementMax: number;
  };
}

export class ParcelleService {
  /**
   * Créer une nouvelle parcelle
   */
  async creerParcelle(parcelleData: Partial<IParcelle>): Promise<IParcelleDocument> {
    try {
      // Validation des coordonnées géographiques pour la Tunisie
      if (parcelleData.latitude && parcelleData.longitude) {
        if (
          parcelleData.latitude < 30.0 || parcelleData.latitude > 37.5 ||
          parcelleData.longitude < 7.0 || parcelleData.longitude > 12.0
        ) {
          throw new Error('Les coordonnées doivent être dans les limites de la Tunisie');
        }
      }

      // ✅ VALIDATION AMÉLIORÉE: S'assurer que farmerName existe
      if (!parcelleData.farmerName && parcelleData.farmerId) {
        parcelleData.farmerName = parcelleData.farmerId;
      }

      const nouvelleParcelle = new Parcelle(parcelleData);
      const parcelleSauvegardee = await nouvelleParcelle.save();

      console.log('✅ Nouvelle parcelle créée:', parcelleSauvegardee.nom);
      return parcelleSauvegardee;
    } catch (error: any) {
      console.error('❌ Erreur lors de la création de la parcelle:', error.message);
      throw new Error(`Erreur de création: ${error.message}`);
    }
  }

  /**
   * ✅ AMÉLIORÉ: Obtenir toutes les parcelles avec filtres avancés
   */
  async obtenirParcelles(query: IParcelleQuery = {}): Promise<{
    parcelles: IParcelleDocument[];
    pagination: IPagination;
  }> {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'dateCreation',
        sortOrder = 'desc',
        culture,
        statut,
        farmerId,
        farmerName,
        type,
        search,
        superficieMin,
        superficieMax,
        investissementMin,
        investissementMax,
        dateCreationDebut,
        dateCreationFin,
        latitude,
        longitude,
        rayon
      } = query;

      // ✅ CONSTRUCTION DU FILTRE AVANCÉ
      const filter: any = {};

      // Filtres de base
      if (culture) filter.culture = culture;
      if (statut) filter.statut = statut;
      if (farmerId) filter.farmerId = farmerId;
      if (farmerName) filter.farmerName = { $regex: farmerName, $options: 'i' };
      if (type) filter.type = type;

      // ✅ NOUVEAUX FILTRES NUMÉRIQUES
      if (superficieMin !== undefined || superficieMax !== undefined) {
        filter.surfaceTotale = {};
        if (superficieMin !== undefined) filter.surfaceTotale.$gte = superficieMin;
        if (superficieMax !== undefined) filter.surfaceTotale.$lte = superficieMax;
      }

      if (investissementMin !== undefined || investissementMax !== undefined) {
        filter.montantInvestissement = {};
        if (investissementMin !== undefined) filter.montantInvestissement.$gte = investissementMin;
        if (investissementMax !== undefined) filter.montantInvestissement.$lte = investissementMax;
      }

      // ✅ FILTRE PAR DATE
      if (dateCreationDebut || dateCreationFin) {
        filter.dateCreation = {};
        if (dateCreationDebut) filter.dateCreation.$gte = new Date(dateCreationDebut);
        if (dateCreationFin) filter.dateCreation.$lte = new Date(dateCreationFin);
      }

      // ✅ FILTRE GÉOGRAPHIQUE PAR PROXIMITÉ
      if (latitude !== undefined && longitude !== undefined && rayon !== undefined) {
        const rayonKm = rayon || 10;
        filter.latitude = {
          $gte: latitude - (rayonKm / 111),
          $lte: latitude + (rayonKm / 111)
        };
        filter.longitude = {
          $gte: longitude - (rayonKm / (111 * Math.cos(latitude * Math.PI / 180))),
          $lte: longitude + (rayonKm / (111 * Math.cos(latitude * Math.PI / 180)))
        };
      }

      // ✅ RECHERCHE TEXTUELLE AMÉLIORÉE
      if (search) {
        filter.$or = [
          { nom: { $regex: search, $options: 'i' } },
          { culture: { $regex: search, $options: 'i' } },
          { farmerId: { $regex: search, $options: 'i' } },
          { farmerName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      // Configuration du tri
      const sortConfig: any = {};
      sortConfig[sortBy] = sortOrder === 'asc' ? 1 : -1;

      // Calcul de la pagination
      const skip = (page - 1) * limit;
      
      // Exécution des requêtes
      const [parcelles, totalItems] = await Promise.all([
        Parcelle.find(filter)
          .sort(sortConfig)
          .skip(skip)
          .limit(limit)
          .lean(),
        Parcelle.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(totalItems / limit);

      const pagination: IPagination = {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      };

      console.log(`📋 ${parcelles.length} parcelles récupérées (page ${page}/${totalPages})`);
      return { parcelles: parcelles as IParcelleDocument[], pagination };
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des parcelles:', error.message);
      throw new Error(`Erreur de récupération: ${error.message}`);
    }
  }

  /**
   * Obtenir une parcelle par ID
   */
  async obtenirParcelleParId(id: string): Promise<IParcelleDocument | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID de parcelle invalide');
      }

      const parcelle = await Parcelle.findById(id);
      
      if (!parcelle) {
        throw new Error('Parcelle non trouvée');
      }

      console.log('🔍 Parcelle trouvée:', parcelle.nom);
      return parcelle;
    } catch (error: any) {
      console.error('❌ Erreur lors de la recherche de parcelle:', error.message);
      throw new Error(`Erreur de recherche: ${error.message}`);
    }
  }

  /**
   * ✅ AMÉLIORÉ: Mettre à jour une parcelle avec validation complète
   */
  async mettreAJourParcelle(id: string, donneesMAJ: Partial<IParcelle>): Promise<IParcelleDocument | null> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID de parcelle invalide');
      }

      // ✅ VALIDATION DES DONNÉES AVANT MISE À JOUR
      if (donneesMAJ.latitude !== undefined && donneesMAJ.longitude !== undefined) {
        if (
          donneesMAJ.latitude < 30.0 || donneesMAJ.latitude > 37.5 ||
          donneesMAJ.longitude < 7.0 || donneesMAJ.longitude > 12.0
        ) {
          throw new Error('Les coordonnées doivent être dans les limites de la Tunisie');
        }
      }

      // ✅ S'assurer que farmerName est cohérent
      if (donneesMAJ.farmerId && !donneesMAJ.farmerName) {
        donneesMAJ.farmerName = donneesMAJ.farmerId;
      }

      // ✅ VALIDATION DES MONTANTS
      if (donneesMAJ.montantInvestissement !== undefined && donneesMAJ.montantInvestissement < 0) {
        throw new Error('Le montant d\'investissement doit être positif');
      }

      // ✅ VALIDATION DE LA SUPERFICIE
      if (donneesMAJ.surfaceTotale !== undefined && donneesMAJ.surfaceTotale < 0) {
        throw new Error('La surface totale doit être positive');
      }

      const parcelleMAJ = await Parcelle.findByIdAndUpdate(
        id,
        { ...donneesMAJ, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!parcelleMAJ) {
        throw new Error('Parcelle non trouvée');
      }

      console.log('✏️ Parcelle mise à jour:', parcelleMAJ.nom);
      return parcelleMAJ;
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour:', error.message);
      throw new Error(`Erreur de mise à jour: ${error.message}`);
    }
  }

  /**
   * ✅ CORRIGÉ: Supprimer une parcelle avec vérifications
   */
  async supprimerParcelle(id: string, options: { force?: boolean } = {}): Promise<{
    success: boolean;
    parcelle?: IParcelleDocument;
    message: string;
  }> {
    try {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new Error('ID de parcelle invalide');
      }

      // ✅ VÉRIFICATION D'EXISTENCE AVANT SUPPRESSION
      const parcelleExistante = await Parcelle.findById(id);
      if (!parcelleExistante) {
        return {
          success: false,
          message: 'Parcelle non trouvée'
        };
      }

      // ✅ POSSIBILITÉ D'AJOUTER DES VÉRIFICATIONS MÉTIER
      if (!options.force) {
        // Par exemple, vérifier s'il y a des dépendances
        // ✅ FIX: Vérifier que montantInvestissement existe et est défini avant la comparaison
        if (parcelleExistante.statut === 'active' && 
            parcelleExistante.montantInvestissement !== undefined && 
            parcelleExistante.montantInvestissement > 0) {
          return {
            success: false,
            message: 'Impossible de supprimer une parcelle active avec investissement. Utilisez l\'option force.',
            parcelle: parcelleExistante
          };
        }
      }

      const parcelleSupprimer = await Parcelle.findByIdAndDelete(id);

      console.log('🗑️ Parcelle supprimée:', parcelleSupprimer?.nom);
      return {
        success: true,
        parcelle: parcelleSupprimer!,
        message: 'Parcelle supprimée avec succès'
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error.message);
      throw new Error(`Erreur de suppression: ${error.message}`);
    }
  }

  /**
   * ✅ NOUVEAU: Supprimer plusieurs parcelles
   */
  async supprimerPlusieurs(ids: string[], options: { force?: boolean } = {}): Promise<{
    success: boolean;
    supprimees: number;
    erreurs: string[];
    message: string;
  }> {
    try {
      const resultats = await Promise.allSettled(
        ids.map(id => this.supprimerParcelle(id, options))
      );

      let supprimees = 0;
      const erreurs: string[] = [];

      resultats.forEach((resultat, index) => {
        if (resultat.status === 'fulfilled' && resultat.value.success) {
          supprimees++;
        } else {
          const message = resultat.status === 'rejected' 
            ? resultat.reason.message 
            : resultat.value.message;
          erreurs.push(`ID ${ids[index]}: ${message}`);
        }
      });

      return {
        success: supprimees > 0,
        supprimees,
        erreurs,
        message: `${supprimees} parcelle(s) supprimée(s) sur ${ids.length}`
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression multiple:', error.message);
      throw new Error(`Erreur de suppression multiple: ${error.message}`);
    }
  }

  /**
   * ✅ NOUVEAU: Obtenir les options de filtres disponibles
   */
  async obtenirFiltresDisponibles(): Promise<IFiltresAvances> {
    try {
      const [cultures, types, agriculteursData, stats] = await Promise.all([
        // Cultures distinctes
        Parcelle.distinct('culture'),
        
        // Types distincts
        Parcelle.distinct('type'),
        
        // Agriculteurs avec stats
        Parcelle.aggregate([
          {
            $group: {
              _id: '$farmerId',
              farmerName: { $first: '$farmerName' },
              nombreParcelles: { $sum: 1 },
              superficieTotale: { $sum: '$surfaceTotale' }
            }
          },
          { $sort: { farmerName: 1 } }
        ]),
        
        // Statistiques pour les ranges
        Parcelle.aggregate([
          {
            $group: {
              _id: null,
              superficieMin: { $min: '$surfaceTotale' },
              superficieMax: { $max: '$surfaceTotale' },
              investissementMin: { $min: '$montantInvestissement' },
              investissementMax: { $max: '$montantInvestissement' }
            }
          }
        ])
      ]);

      const statistiques = stats[0] || {
        superficieMin: 0,
        superficieMax: 1000,
        investissementMin: 0,
        investissementMax: 100000
      };

      return {
        cultures: cultures.sort(),
        types: types.sort(),
        agriculteurs: agriculteursData.map(ag => ({
          farmerId: ag._id,
          farmerName: ag.farmerName || ag._id,
          nombreParcelles: ag.nombreParcelles
        })),
        statistiques
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des filtres:', error.message);
      throw new Error(`Erreur de récupération des filtres: ${error.message}`);
    }
  }

  /**
   * ✅ NOUVEAU: Mettre à jour le statut de plusieurs parcelles
   */
  async mettreAJourStatutPlusieurs(
    ids: string[], 
    nouveauStatut: 'active' | 'repos' | 'preparation'
  ): Promise<{
    success: boolean;
    modifiees: number;
    erreurs: string[];
  }> {
    try {
      const objectIds = ids.filter(id => mongoose.Types.ObjectId.isValid(id));
      
      if (objectIds.length === 0) {
        throw new Error('Aucun ID valide fourni');
      }

      const resultat = await Parcelle.updateMany(
        { _id: { $in: objectIds } },
        { 
          statut: nouveauStatut,
          updatedAt: new Date()
        }
      );

      return {
        success: true,
        modifiees: resultat.modifiedCount,
        erreurs: []
      };
    } catch (error: any) {
      console.error('❌ Erreur lors de la mise à jour multiple:', error.message);
      return {
        success: false,
        modifiees: 0,
        erreurs: [error.message]
      };
    }
  }

  /**
   * Obtenir les parcelles par agriculteur
   */
  async obtenirParcellesParFarmerId(farmerId: string): Promise<IParcelleDocument[]> {
    try {
      const parcelles = await Parcelle.find({ farmerId })
        .sort({ dateCreation: -1 });

      console.log(`👨‍🌾 ${parcelles.length} parcelles trouvées pour l'agriculteur ${farmerId}`);
      return parcelles;
    } catch (error: any) {
      console.error('❌ Erreur lors de la recherche par farmerId:', error.message);
      throw new Error(`Erreur de recherche: ${error.message}`);
    }
  }

  /**
   * Rechercher des parcelles par proximité géographique
   */
  async rechercherParProximite(
    latitude: number,
    longitude: number,
    rayonKm: number = 10
  ): Promise<IParcelleDocument[]> {
    try {
      // Validation des coordonnées
      if (latitude < 30.0 || latitude > 37.5 || longitude < 7.0 || longitude > 12.0) {
        throw new Error('Les coordonnées de recherche doivent être dans les limites de la Tunisie');
      }

      const parcelles = await Parcelle.find({
        latitude: {
          $gte: latitude - (rayonKm / 111),
          $lte: latitude + (rayonKm / 111)
        },
        longitude: {
          $gte: longitude - (rayonKm / (111 * Math.cos(latitude * Math.PI / 180))),
          $lte: longitude + (rayonKm / (111 * Math.cos(latitude * Math.PI / 180)))
        }
      }).sort({ dateCreation: -1 });

      console.log(`📍 ${parcelles.length} parcelles trouvées dans un rayon de ${rayonKm}km`);
      return parcelles;
    } catch (error: any) {
      console.error('❌ Erreur lors de la recherche par proximité:', error.message);
      throw new Error(`Erreur de recherche par proximité: ${error.message}`);
    }
  }

  /**
   * ✅ AMÉLIORÉ: Obtenir les statistiques complètes
   */
  async obtenirStatistiques(): Promise<IParcelleStats> {
    try {
      const [
        totalParcelles,
        statsParStatut,
        statsParCulture,
        statsParType,
        statsFinancieres
      ] = await Promise.all([
        // Total des parcelles
        Parcelle.countDocuments(),

        // Statistiques par statut
        Parcelle.aggregate([
          {
            $group: {
              _id: '$statut',
              count: { $sum: 1 }
            }
          }
        ]),

        // Statistiques par culture
        Parcelle.aggregate([
          {
            $group: {
              _id: '$culture',
              count: { $sum: 1 }
            }
          }
        ]),

        // Statistiques par type
        Parcelle.aggregate([
          {
            $group: {
              _id: '$type',
              count: { $sum: 1 }
            }
          }
        ]),

        // Statistiques financières et de surface
        Parcelle.aggregate([
          {
            $group: {
              _id: null,
              surfaceTotale: { $sum: '$surfaceTotale' },
              investissementTotal: { $sum: '$montantInvestissement' },
              moyenneInvestissement: { $avg: '$montantInvestissement' }
            }
          }
        ])
      ]);

      // Formatage des résultats
      const parcellesParStatut = {
        active: 0,
        repos: 0,
        preparation: 0
      };

      statsParStatut.forEach((stat: any) => {
        if (stat._id in parcellesParStatut) {
          parcellesParStatut[stat._id as keyof typeof parcellesParStatut] = stat.count;
        }
      });

      const parcellesParCulture: Record<string, number> = {};
      statsParCulture.forEach((stat: any) => {
        parcellesParCulture[stat._id] = stat.count;
      });

      const parcellesParType: Record<string, number> = {};
      statsParType.forEach((stat: any) => {
        parcellesParType[stat._id] = stat.count;
      });

      const financieres = statsFinancieres[0] || {
        surfaceTotale: 0,
        investissementTotal: 0,
        moyenneInvestissement: 0
      };

      const stats: IParcelleStats = {
        totalParcelles,
        parcellesParStatut,
        parcellesParCulture,
        parcellesParType,
        surfaceTotaleParcelles: financieres.surfaceTotale || 0,
        investissementTotal: financieres.investissementTotal || 0,
        moyenneInvestissementParParcelle: financieres.moyenneInvestissement || 0
      };

      console.log('📊 Statistiques calculées:', stats);
      return stats;
    } catch (error: any) {
      console.error('❌ Erreur lors du calcul des statistiques:', error.message);
      throw new Error(`Erreur de calcul des statistiques: ${error.message}`);
    }
  }

  /**
   * Rechercher des parcelles par texte
   */
  async rechercherParTexte(texte: string): Promise<IParcelleDocument[]> {
    try {
      const parcelles = await Parcelle.find({
        $text: { $search: texte }
      }, {
        score: { $meta: 'textScore' }
      }).sort({
        score: { $meta: 'textScore' }
      });

      console.log(`🔍 ${parcelles.length} parcelles trouvées pour la recherche: "${texte}"`);
      return parcelles;
    } catch (error: any) {
      console.error('❌ Erreur lors de la recherche textuelle:', error.message);
      throw new Error(`Erreur de recherche textuelle: ${error.message}`);
    }
  }

  /**
   * Obtenir les cultures disponibles
   */
  async obtenirCulturesDisponibles(): Promise<string[]> {
    try {
      const cultures = await Parcelle.distinct('culture');
      console.log(`🌱 ${cultures.length} types de cultures trouvés`);
      return cultures.sort();
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des cultures:', error.message);
      throw new Error(`Erreur de récupération des cultures: ${error.message}`);
    }
  }

  /**
   * Obtenir les agriculteurs disponibles
   */
  async obtenirAgriculteursDisponibles(): Promise<string[]> {
    try {
      const agriculteurs = await Parcelle.distinct('farmerId');
      console.log(`👨‍🌾 ${agriculteurs.length} agriculteurs trouvés`);
      return agriculteurs.sort();
    } catch (error: any) {
      console.error('❌ Erreur lors de la récupération des agriculteurs:', error.message);
      throw new Error(`Erreur de récupération des agriculteurs: ${error.message}`);
    }
  }

  /**
   * Valider les coordonnées pour la Tunisie
   */
  validerCoordonneesTunisie(latitude: number, longitude: number): boolean {
    return latitude >= 30.0 && latitude <= 37.5 && longitude >= 7.0 && longitude <= 12.0;
  }

  /**
   * Calculer la distance entre deux points (en km)
   */
  calculerDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180);
  }
}