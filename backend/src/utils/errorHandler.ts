import { Request, Response, NextFunction } from 'express';

// Interface d'erreur personnalisée
export interface IError extends Error {
  statusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: number; // ✅ Ajout pour éviter l'erreur ts(2339)
}

// Classe d'erreur de base
export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Sous-classes pour types d'erreurs spécifiques
export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Ressource non trouvée') {
    super(message, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Non autorisé') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Accès interdit') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflit de données') {
    super(message, 409);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Erreur interne du serveur') {
    super(message, 500);
  }
}

// Gestion des erreurs en développement
const sendErrorDev = (err: IError, res: Response) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    stack: err.stack,
    ...(err.statusCode && { statusCode: err.statusCode })
  });
};

// Gestion des erreurs en production
const sendErrorProd = (err: IError, res: Response) => {
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message
    });
  } else {
    console.error('ERROR 💥:', err);
    res.status(500).json({
      success: false,
      error: 'Une erreur est survenue!'
    });
  }
};

// Gestion des erreurs de validation MongoDB
const handleValidationErrorDB = (err: any): AppError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Données invalides: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

// Gestion des erreurs de duplication MongoDB
const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
  const message = `Valeur dupliquée: ${value}. Veuillez utiliser une autre valeur!`;
  return new AppError(message, 400);
};

// Gestion des erreurs CastError MongoDB
const handleCastErrorDB = (err: any): AppError => {
  const message = `ID invalide: ${err.value}`;
  return new AppError(message, 400);
};

// Middleware de gestion d'erreurs global
export const globalErrorHandler = (
  err: IError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err } as IError;
    error.message = err.message;

    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error); // ✅ plus d'erreur ici

    sendErrorProd(error, res);
  }
};

// Middleware pour capturer les erreurs async
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware pour les routes non trouvées
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const err = new NotFoundError(`Route ${req.originalUrl} non trouvée sur ce serveur!`);
  next(err);
};

// Logger d'erreurs
export const logError = (err: Error) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    message: err.message,
    stack: err.stack,
    name: err.name
  };

  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 ERROR LOG:', JSON.stringify(errorInfo, null, 2));
  } else {
    console.error('🚨 ERROR:', err.message);
  }
};

// Codes d'erreur HTTP communs
export const HTTP_STATUS = {
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

// Messages d'erreur standardisés
export const ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Erreur de validation des données',
  NOT_FOUND: 'Ressource non trouvée',
  UNAUTHORIZED: 'Accès non autorisé',
  FORBIDDEN: 'Accès interdit',
  CONFLICT: 'Conflit de données',
  INTERNAL_ERROR: 'Erreur interne du serveur',
  INVALID_ID: 'ID invalide',
  INVALID_COORDINATES: 'Coordonnées invalides',
  PARCELLE_NOT_FOUND: 'Parcelle non trouvée',
  FARMER_NOT_FOUND: 'Agriculteur non trouvé',
  INVALID_TUNISIA_COORDINATES: 'Coordonnées hors des limites de la Tunisie',
  DATABASE_CONNECTION_ERROR: 'Erreur de connexion à la base de données',
  INVALID_SEARCH_PARAMS: 'Paramètres de recherche invalides'
};
