const mongoParcel = require('../configuration/dbconfig') as typeof import('mongoose');

import type mongoose from 'mongoose';

import { Schema, Document, Model } from 'mongoose';


// Interface pour les coordonnées
export interface ICoordonnees {
  lat: number;
  lng: number;
} 

// Interface pour les parcelles dessinées
export interface IDrawnParcel {
  type: 'polygon' | 'rectangle' | 'circle';
  coords: ICoordonnees[] | ICoordonnees;
  radius?: number;
  area: number;
  perimeter?: number;
}

// Interface pour la parcelle de base
export interface IParcelle {
  nom: string;
  latitude: number;
  longitude: number;
  superficie: string;
  type: string;
  statut: 'active' | 'repos' | 'preparation' | 'inactive' | 'en_preparation' | 'en_repos';
  montantInvestissement?: number;
  farmerId: string;
  farmerName: string; // ✅ AJOUTÉ: Nom de l'agriculteur
  dateCreation: Date;
  culture: string;
  description?: string;
  coordonnees?: any;
  formeType?: 'polygon' | 'rectangle' | 'circle' | 'marker';
  surfaceTotale?: number;
  drawnParcels?: IDrawnParcel[];
}

// Interface pour les méthodes d'instance
export interface IParcelleInstanceMethods {
  calculerSurfaceTotale(): number;
  estDansLimitesTunisie(): boolean;
  getDisplayName(): string; // ✅ AJOUTÉ: Méthode pour obtenir le nom d'affichage
}

// Interface pour les méthodes statiques
export interface IParcelleStaticMethods {
  rechercherParProximite(
    latitude: number, 
    longitude: number, 
    rayonKm?: number
  ): Promise<IParcelleDocument[]>;
  obtenirStatistiques(): Promise<any>; // ✅ AJOUTÉ: Méthode pour les statistiques
}

// Interface pour le document MongoDB avec méthodes
export interface IParcelleDocument extends IParcelle, Document, IParcelleInstanceMethods {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Interface pour le modèle complet
export interface IParcelleModel extends Model<IParcelleDocument>, IParcelleStaticMethods {}

// Schéma pour les parcelles dessinées
const DrawnParcelSchema = new Schema<IDrawnParcel>({
  type: {
    type: String,
    enum: ['polygon', 'rectangle', 'circle'],
    required: true
  },
  coords: {
    type: Schema.Types.Mixed,
    required: true
  },
  radius: {
    type: Number,
    min: [0, 'Le rayon doit être positif']
  },
  area: {
    type: Number,
    required: true,
    min: [0, 'L\'aire doit être positive']
  },
  perimeter: {
    type: Number,
    min: [0, 'Le périmètre doit être positif']
  }
}, { _id: false });

// Schéma principal de la parcelle
const ParcelleSchema = new Schema<IParcelleDocument, IParcelleModel>({
  nom: {
    type: String,
    required: [true, 'Le nom de la parcelle est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères'],
    index: true
  },

  latitude: {
    type: Number,
    required: [true, 'La latitude est requise'],
    min: [30.0, 'Latitude minimale pour la Tunisie: 30.0'],
    max: [37.5, 'Latitude maximale pour la Tunisie: 37.5']
  },

  longitude: {
    type: Number,
    required: [true, 'La longitude est requise'],
    min: [7.0, 'Longitude minimale pour la Tunisie: 7.0'],
    max: [12.0, 'Longitude maximale pour la Tunisie: 12.0']
  },

  // ✅ CORRIGÉ: Superficie avec validation plus flexible
  superficie: {
    type: String,
    required: [true, 'La superficie est requise'],
    trim: true,
    validate: {
      validator: function(v: string) {
        // Accepte: "1000 m2", "1000 m²", "1.5 hectares", "2 ha", "5000"
        return /^\d+(\.\d+)?\s*(m2|m²|hectares?|ha)?$/i.test(v);
      },
      message: 'Format de superficie invalide (ex: "1000 m²", "1.5 hectares", ou "5000")'
    }
  },

  // ✅ CORRIGÉ: Types de parcelles mis à jour avec tous les types possibles
  type: {
    type: String,
    required: [true, 'Le type de parcelle est requis'],
    enum: {
      values: [
        'Résidentiel', 'Commercial', 'Industriel', 'Agricole', 'Touristique', 'Mixte',
        // Types agricoles spécifiques
        'agricole', 'irrigue', 'maraicher', 'arboriculture', 'elevage',
        'pluvial', 'serre', 'tunnel', 'plein_champ'
      ],
      message: 'Type de parcelle invalide'
    },
    index: true
  },

  // ✅ CORRIGÉ: Statuts mis à jour
  statut: {
    type: String,
    enum: {
      values: ['active', 'repos', 'preparation', 'inactive', 'en_preparation', 'en_repos'],
      message: 'Statut invalide'
    },
    default: 'preparation',
    index: true
  },

  montantInvestissement: {
    type: Number,
    min: [0, 'Le montant d\'investissement doit être positif'],
    max: [999999999, 'Montant d\'investissement trop élevé'],
    default: 0
  },

  farmerId: {
    type: String,
    required: [true, 'L\'ID de l\'agriculteur est requis'],
    trim: true,
    minlength: [2, 'L\'ID agriculteur doit contenir au moins 2 caractères'],
    maxlength: [50, 'L\'ID agriculteur ne peut pas dépasser 50 caractères'],
    index: true
  },

  // ✅ AJOUTÉ: Nom de l'agriculteur - CHAMP PRINCIPAL POUR L'AFFICHAGE
  farmerName: {
    type: String,
    required: [true, 'Le nom de l\'agriculteur est requis'],
    trim: true,
    minlength: [2, 'Le nom de l\'agriculteur doit contenir au moins 2 caractères'],
    maxlength: [100, 'Le nom de l\'agriculteur ne peut pas dépasser 100 caractères'],
    index: true
  },

  dateCreation: {
    type: Date,
    default: Date.now,
    index: true
  },

  culture: {
    type: String,
    required: [true, 'Le type de culture est requis'],
    trim: true,
    lowercase: true, // ✅ AJOUTÉ: Normalise les cultures en minuscules
    minlength: [2, 'Le nom de culture doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom de culture ne peut pas dépasser 50 caractères'],
    index: true
  },

  // ✅ CORRIGÉ: Description optionnelle
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'La description ne peut pas dépasser 500 caractères'],
    default: ''
  },

  coordonnees: {
    type: Schema.Types.Mixed,
    validate: {
      validator: function(this: IParcelleDocument, v: any) {
        if (!v) return true; // Optionnel
        
        const formeType = this.formeType;
        if (!formeType) return true;

        switch (formeType) {
          case 'polygon':
            return Array.isArray(v) && v.length >= 3;
          case 'rectangle':
            return Array.isArray(v) && v.length === 2;
          case 'circle':
            return v.center && typeof v.radius === 'number';
          default:
            return true;
        }
      },
      message: 'Format de coordonnées invalide pour le type de forme spécifié'
    }
  },

  formeType: {
    type: String,
    enum: {
      values: ['polygon', 'rectangle', 'circle', 'marker'],
      message: 'Type de forme invalide'
    },
    default: 'marker'
  },

  surfaceTotale: {
    type: Number,
    min: [0, 'La surface totale doit être positive'],
    max: [999999999, 'Surface totale trop élevée']
  },

  drawnParcels: {
    type: [DrawnParcelSchema],
    default: [],
    validate: {
      validator: function(v: IDrawnParcel[]) {
        return v.length <= 50;
      },
      message: 'Nombre maximum de parcelles dessinées dépassé (50 max)'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      // ✅ IMPORTANT: Assurer que farmerName est toujours présent
      if (!ret.farmerName && ret.farmerId) {
        ret.farmerName = ret.farmerId;
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  },
  toObject: {
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      // ✅ IMPORTANT: Assurer que farmerName est toujours présent
      if (!ret.farmerName && ret.farmerId) {
        ret.farmerName = ret.farmerId;
      }
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Index composés pour de meilleures performances
ParcelleSchema.index({ latitude: 1, longitude: 1 });
ParcelleSchema.index({ farmerId: 1, dateCreation: -1 });
ParcelleSchema.index({ farmerName: 1, dateCreation: -1 }); // ✅ AJOUTÉ
ParcelleSchema.index({ culture: 1, statut: 1 });
ParcelleSchema.index({ type: 1, statut: 1 });

// Index de recherche textuelle incluant farmerName
ParcelleSchema.index({
  nom: 'text',
  culture: 'text',
  farmerId: 'text',
  farmerName: 'text' // ✅ AJOUTÉ
}, {
  weights: {
    farmerName: 15, // ✅ Poids le plus élevé pour les recherches
    nom: 10,
    culture: 5,
    farmerId: 3
  }
});

// Virtual pour l'ID
ParcelleSchema.virtual('id').get(function(this: IParcelleDocument) {
  return this._id.toHexString();
});

// ✅ AJOUTÉ: Virtual pour l'ID d'affichage court
ParcelleSchema.virtual('displayId').get(function(this: IParcelleDocument) {
  return this._id.toString().slice(-6);
});

// Middleware pre-save
ParcelleSchema.pre<IParcelleDocument>('save', function(next) {
  // ✅ AJOUTÉ: S'assurer que farmerName existe
  if (!this.farmerName && this.farmerId) {
    this.farmerName = this.farmerId;
  }

  // Validation des coordonnées géographiques
  if (this.latitude < 30.0 || this.latitude > 37.5) {
    return next(new Error('Latitude hors des limites de la Tunisie'));
  }
  
  if (this.longitude < 7.0 || this.longitude > 12.0) {
    return next(new Error('Longitude hors des limites de la Tunisie'));
  }

  // Calcul automatique de la surface totale
  if (this.drawnParcels && this.drawnParcels.length > 0) {
    this.surfaceTotale = this.drawnParcels.reduce((total, parcel) => total + parcel.area, 0);
  } else if (!this.surfaceTotale && this.superficie) {
    // Essayer de convertir la superficie en nombre
    const superficieNum = parseFloat(this.superficie.replace(/[^\d.]/g, ''));
    if (!isNaN(superficieNum)) {
      this.surfaceTotale = superficieNum;
    }
  }

  next();
});

// ✅ MÉTHODES D'INSTANCE AMÉLIORÉES
ParcelleSchema.methods.calculerSurfaceTotale = function(this: IParcelleDocument): number {
  if (this.drawnParcels && this.drawnParcels.length > 0) {
    return this.drawnParcels.reduce((total: number, parcel: IDrawnParcel) => total + parcel.area, 0);
  }
  return this.surfaceTotale || 0;
};

ParcelleSchema.methods.estDansLimitesTunisie = function(this: IParcelleDocument): boolean {
  return this.latitude >= 30.0 && this.latitude <= 37.5 &&
         this.longitude >= 7.0 && this.longitude <= 12.0;
};

// ✅ AJOUTÉ: Méthode pour obtenir le nom d'affichage
ParcelleSchema.methods.getDisplayName = function(this: IParcelleDocument): string {
  return this.farmerName || this.farmerId || 'Agriculteur inconnu';
};

// ✅ MÉTHODES STATIQUES AMÉLIORÉES
ParcelleSchema.statics.rechercherParProximite = function(
  this: IParcelleModel,
  latitude: number, 
  longitude: number, 
  rayonKm: number = 10
): Promise<IParcelleDocument[]> {
  return this.find({
    latitude: {
      $gte: latitude - (rayonKm / 111),
      $lte: latitude + (rayonKm / 111)
    },
    longitude: {
      $gte: longitude - (rayonKm / (111 * Math.cos(latitude * Math.PI / 180))),
      $lte: longitude + (rayonKm / (111 * Math.cos(latitude * Math.PI / 180)))
    }
  });
};

// ✅ AJOUTÉ: Méthode pour obtenir les statistiques
ParcelleSchema.statics.obtenirStatistiques = function(this: IParcelleModel) {
  return this.aggregate([
    {
      $group: {
        _id: null,
        totalParcelles: { $sum: 1 },
        parcellesActives: {
          $sum: { $cond: [{ $eq: ['$statut', 'active'] }, 1, 0] }
        },
        superficieTotale: { $sum: '$surfaceTotale' },
        investissementTotal: { $sum: '$montantInvestissement' },
        agriculteurs: { $addToSet: '$farmerName' }
      }
    },
    {
      $project: {
        _id: 0,
        totalParcelles: 1,
        parcellesActives: 1,
        superficieTotale: 1,
        investissementTotal: 1,
        nombreAgriculteurs: { $size: '$agriculteurs' }
      }
    }
  ]);
};

const Parcelle = mongoParcel.model<IParcelleDocument, IParcelleModel>('Parcelle', ParcelleSchema);

export default Parcelle;