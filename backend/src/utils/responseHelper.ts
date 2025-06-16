import { Response } from 'express';

export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: any[];
  pagination?: IPaginationInfo;
  meta?: any;
  timestamp?: Date;
}

export interface IPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export class ResponseHelper {
  /**
   * Réponse de succès
   */
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Opération réussie',
    statusCode: number = 200,
    pagination?: IPaginationInfo,
    meta?: any
  ): Response {
    const response: IApiResponse<T> = {
      success: true,
      message,
      data,
      timestamp: new Date()
    };

    if (pagination) {
      response.pagination = pagination;
    }

    if (meta) {
      response.meta = meta;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Réponse d'erreur
   */
  static error(
    res: Response,
    error: string,
    statusCode: number = 500,
    errors?: any[]
  ): Response {
    const response: IApiResponse = {
      success: false,
      error,
      timestamp: new Date()
    };

    if (errors && errors.length > 0) {
      response.errors = errors;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Réponse de validation d'erreur
   */
  static validationError(
    res: Response,
    message: string = 'Erreur de validation',
    errors: any[] = []
  ): Response {
    return this.error(res, message, 400, errors);
  }

  /**
   * Réponse non trouvé
   */
  static notFound(
    res: Response,
    message: string = 'Ressource non trouvée'
  ): Response {
    return this.error(res, message, 404);
  }

  /**
   * Réponse non autorisé
   */
  static unauthorized(
    res: Response,
    message: string = 'Accès non autorisé'
  ): Response {
    return this.error(res, message, 401);
  }

  /**
   * Réponse interdit
   */
  static forbidden(
    res: Response,
    message: string = 'Accès interdit'
  ): Response {
    return this.error(res, message, 403);
  }

  /**
   * Réponse de conflit
   */
  static conflict(
    res: Response,
    message: string = 'Conflit de données'
  ): Response {
    return this.error(res, message, 409);
  }

  /**
   * Réponse de création réussie
   */
  static created<T>(
    res: Response,
    data: T,
    message: string = 'Ressource créée avec succès'
  ): Response {
    return this.success(res, data, message, 201);
  }

  /**
   * Réponse de suppression réussie
   */
  static deleted(
    res: Response,
    message: string = 'Ressource supprimée avec succès'
  ): Response {
    return this.success(res, null, message, 200);
  }

  /**
   * Réponse de mise à jour réussie
   */
  static updated<T>(
    res: Response,
    data: T,
    message: string = 'Ressource mise à jour avec succès'
  ): Response {
    return this.success(res, data, message, 200);
  }

  /**
   * Réponse avec pagination
   */
  static paginated<T>(
    res: Response,
    data: T[],
    pagination: IPaginationInfo,
    message: string = 'Données récupérées avec succès'
  ): Response {
    return this.success(res, data, message, 200, pagination);
  }

  /**
   * Réponse d'erreur interne du serveur
   */
  static internalError(
    res: Response,
    message: string = 'Erreur interne du serveur'
  ): Response {
    return this.error(res, message, 500);
  }

  /**
   * Réponse de trop de requêtes
   */
  static tooManyRequests(
    res: Response,
    message: string = 'Trop de requêtes, veuillez réessayer plus tard'
  ): Response {
    return this.error(res, message, 429);
  }

  /**
   * Réponse de mauvaise requête
   */
  static badRequest(
    res: Response,
    message: string = 'Requête invalide',
    errors?: any[]
  ): Response {
    return this.error(res, message, 400, errors);
  }

  /**
   * Réponse de service non disponible
   */
  static serviceUnavailable(
    res: Response,
    message: string = 'Service temporairement indisponible'
  ): Response {
    return this.error(res, message, 503);
  }
}

/**
 * Utilitaires pour formater les données
 */
export class DataFormatter {
  /**
   * Formater les informations de pagination
   */
  static formatPagination(
    currentPage: number,
    totalItems: number,
    itemsPerPage: number
  ): IPaginationInfo {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    return {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  }

  /**
   * Formater les coordonnées géographiques
   */
  static formatCoordinates(latitude: number, longitude: number) {
    return {
      latitude: parseFloat(latitude.toFixed(6)),
      longitude: parseFloat(longitude.toFixed(6)),
      formatted: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
    };
  }

  /**
   * Formater la superficie
   */
  static formatSuperficie(superficie: number, unite: string = 'm²') {
    if (unite === 'm²') {
      if (superficie >= 10000) {
        return {
          valeur: parseFloat((superficie / 10000).toFixed(3)),
          unite: 'hectares',
          original: superficie,
          formatted: `${(superficie / 10000).toFixed(3)} hectares`
        };
      }
    }
    
    return {
      valeur: superficie,
      unite,
      formatted: `${superficie} ${unite}`
    };
  }

  /**
   * Formater la distance
   */
  static formatDistance(distanceKm: number) {
    if (distanceKm < 1) {
      return {
        valeur: Math.round(distanceKm * 1000),
        unite: 'm',
        formatted: `${Math.round(distanceKm * 1000)} m`
      };
    }
    
    return {
      valeur: parseFloat(distanceKm.toFixed(2)),
      unite: 'km',
      formatted: `${distanceKm.toFixed(2)} km`
    };
  }

  /**
   * Formater les dates
   */
  static formatDate(date: Date, locale: string = 'fr-TN') {
    return {
      iso: date.toISOString(),
      locale: date.toLocaleDateString(locale),
      timestamp: date.getTime(),
      relative: this.getRelativeTime(date)
    };
  }

  /**
   * Obtenir le temps relatif
   */
  private static getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return `il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else if (diffMinutes > 0) {
      return `il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else {
      return 'à l\'instant';
    }
  }

  /**
   * Formater les statistiques
   */
  static formatStats(stats: any) {
    return {
      ...stats,
      formatted: {
        totalParcelles: stats.totalParcelles.toLocaleString('fr-TN'),
        surfaceTotale: this.formatSuperficie(stats.surfaceTotaleParcelles || 0),
        investissementTotal: this.formatCurrency(stats.investissementTotal || 0),
        moyenneInvestissement: this.formatCurrency(stats.moyenneInvestissementParParcelle || 0)
      }
    };
  }

  /**
   * Formater la monnaie
   */
  static formatCurrency(montant: number, devise: string = 'TND') {
    return {
      valeur: montant,
      devise,
      formatted: `${montant.toLocaleString('fr-TN', { minimumFractionDigits: 2 })} ${devise}`
    };
  }
}

/**
 * Messages de réponse standardisés
 */
export const RESPONSE_MESSAGES = {
  // Succès
  SUCCESS: 'Opération réussie',
  CREATED: 'Ressource créée avec succès',
  UPDATED: 'Ressource mise à jour avec succès',
  DELETED: 'Ressource supprimée avec succès',
  RETRIEVED: 'Données récupérées avec succès',
  
  // Parcelles spécifiques
  PARCELLE_CREATED: 'Parcelle créée avec succès',
  PARCELLE_UPDATED: 'Parcelle mise à jour avec succès',
  PARCELLE_DELETED: 'Parcelle supprimée avec succès',
  PARCELLE_RETRIEVED: 'Parcelle récupérée avec succès',
  PARCELLES_RETRIEVED: 'Parcelles récupérées avec succès',
  PARCELLE_NOT_FOUND: 'Parcelle non trouvée',
  
  // Recherche
  SEARCH_RESULTS: 'Résultats de recherche récupérés',
  NO_RESULTS: 'Aucun résultat trouvé',
  PROXIMITY_RESULTS: 'Parcelles trouvées dans la zone de recherche',
  
  // Statistiques
  STATS_RETRIEVED: 'Statistiques récupérées avec succès',
  CULTURES_RETRIEVED: 'Liste des cultures récupérée',
  FARMERS_RETRIEVED: 'Liste des agriculteurs récupérée',
  
  // Validation
  COORDINATES_VALID: 'Coordonnées valides pour la Tunisie',
  COORDINATES_INVALID: 'Coordonnées invalides pour la Tunisie',
  DISTANCE_CALCULATED: 'Distance calculée avec succès',
  
  // Erreurs
  VALIDATION_ERROR: 'Erreur de validation des données',
  INVALID_REQUEST: 'Requête invalide',
  INTERNAL_ERROR: 'Erreur interne du serveur',
  DATABASE_ERROR: 'Erreur de base de données',
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Accès interdit',
  NOT_FOUND: 'Ressource non trouvée',
  CONFLICT: 'Conflit de données',
  TOO_MANY_REQUESTS: 'Trop de requêtes'
};

/**
 * Codes de statut HTTP
 */
export const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};