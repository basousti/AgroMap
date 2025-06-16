export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface ILogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta?: any;
  service?: string;
  requestId?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private serviceName: string;

  private constructor(serviceName: string = 'AgroMap-API') {
    this.serviceName = serviceName;
    this.logLevel = this.getLogLevelFromEnv();
  }

  public static getInstance(serviceName?: string): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(serviceName);
    }
    return Logger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase();
    switch (level) {
      case 'ERROR':
        return LogLevel.ERROR;
      case 'WARN':
        return LogLevel.WARN;
      case 'INFO':
        return LogLevel.INFO;
      case 'DEBUG':
        return LogLevel.DEBUG;
      default:
        return LogLevel.INFO;
    }
  }

  private formatMessage(level: string, message: string, meta?: any): ILogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.serviceName,
      ...(meta && { meta })
    };
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private writeLog(logEntry: ILogEntry): void {
    const formattedLog = JSON.stringify(logEntry, null, 2);
    
    if (process.env.NODE_ENV === 'development') {
      // En développement, afficher dans la console avec couleurs
      const colors = {
        ERROR: '\x1b[31m', // Rouge
        WARN: '\x1b[33m',  // Jaune
        INFO: '\x1b[36m',  // Cyan
        DEBUG: '\x1b[35m', // Magenta
        RESET: '\x1b[0m'
      };
      
      const color = colors[logEntry.level as keyof typeof colors] || colors.RESET;
      console.log(`${color}[${logEntry.level}] ${logEntry.timestamp} - ${logEntry.message}${colors.RESET}`);
      
      if (logEntry.meta) {
        console.log(`${color}Meta:${colors.RESET}`, logEntry.meta);
      }
    } else {
      // En production, format JSON pour les outils de logging
      console.log(formattedLog);
    }
  }

  public error(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const logEntry = this.formatMessage('ERROR', message, meta);
      this.writeLog(logEntry);
    }
  }

  public warn(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const logEntry = this.formatMessage('WARN', message, meta);
      this.writeLog(logEntry);
    }
  }

  public info(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const logEntry = this.formatMessage('INFO', message, meta);
      this.writeLog(logEntry);
    }
  }

  public debug(message: string, meta?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const logEntry = this.formatMessage('DEBUG', message, meta);
      this.writeLog(logEntry);
    }
  }

  // Méthodes spécialisées pour l'API AgroMap
  public logParcelleCreated(parcelleNom: string, farmerId: string): void {
    this.info(`✅ Nouvelle parcelle créée: ${parcelleNom}`, {
      action: 'CREATE_PARCELLE',
      parcelle: parcelleNom,
      farmerId
    });
  }

  public logParcelleUpdated(parcelleId: string, parcelleNom: string): void {
    this.info(`✏️ Parcelle mise à jour: ${parcelleNom}`, {
      action: 'UPDATE_PARCELLE',
      parcelleId,
      parcelle: parcelleNom
    });
  }

  public logParcelleDeleted(parcelleId: string, parcelleNom: string): void {
    this.info(`🗑️ Parcelle supprimée: ${parcelleNom}`, {
      action: 'DELETE_PARCELLE',
      parcelleId,
      parcelle: parcelleNom
    });
  }

  public logSearch(searchType: string, query: any, resultsCount: number): void {
    this.info(`🔍 Recherche effectuée: ${searchType}`, {
      action: 'SEARCH',
      searchType,
      query,
      resultsCount
    });
  }

  public logApiRequest(method: string, path: string, statusCode: number, responseTime?: number): void {
    const message = `${method} ${path} - ${statusCode}`;
    const meta = {
      action: 'API_REQUEST',
      method,
      path,
      statusCode,
      ...(responseTime && { responseTime: `${responseTime}ms` })
    };

    if (statusCode >= 400) {
      this.warn(message, meta);
    } else {
      this.info(message, meta);
    }
  }

  public logDatabaseOperation(operation: string, collection: string, duration?: number): void {
    this.debug(`📊 Opération DB: ${operation} sur ${collection}`, {
      action: 'DATABASE_OPERATION',
      operation,
      collection,
      ...(duration && { duration: `${duration}ms` })
    });
  }

  public logCoordinatesValidation(latitude: number, longitude: number, isValid: boolean): void {
    this.debug(`📍 Validation coordonnées: ${latitude}, ${longitude} - ${isValid ? 'VALIDE' : 'INVALIDE'}`, {
      action: 'COORDINATES_VALIDATION',
      latitude,
      longitude,
      isValid
    });
  }

  public logProximitySearch(centerLat: number, centerLng: number, radius: number, foundCount: number): void {
    this.info(`🎯 Recherche proximité: ${foundCount} parcelles trouvées`, {
      action: 'PROXIMITY_SEARCH',
      center: { latitude: centerLat, longitude: centerLng },
      radius,
      foundCount
    });
  }

  public logStatsCalculation(totalParcelles: number, calculationTime?: number): void {
    this.info(`📊 Statistiques calculées pour ${totalParcelles} parcelles`, {
      action: 'STATS_CALCULATION',
      totalParcelles,
      ...(calculationTime && { calculationTime: `${calculationTime}ms` })
    });
  }

  public logValidationError(field: string, value: any, errorMessage: string): void {
    this.warn(`⚠️ Erreur de validation: ${field}`, {
      action: 'VALIDATION_ERROR',
      field,
      value,
      errorMessage
    });
  }

  public logSystemHealth(status: 'healthy' | 'unhealthy', details?: any): void {
    const message = `🏥 État système: ${status.toUpperCase()}`;
    const meta = {
      action: 'SYSTEM_HEALTH',
      status,
      ...details
    };

    if (status === 'healthy') {
      this.info(message, meta);
    } else {
      this.error(message, meta);
    }
  }

  public logPerformanceMetric(operation: string, duration: number, threshold?: number): void {
    const isSlowOperation = threshold && duration > threshold;
    const message = `⚡ Performance: ${operation} - ${duration}ms`;
    
    const meta = {
      action: 'PERFORMANCE_METRIC',
      operation,
      duration,
      ...(threshold && { threshold, isSlowOperation })
    };

    if (isSlowOperation) {
      this.warn(message, meta);
    } else {
      this.debug(message, meta);
    }
  }
}

// Instance par défaut
export const logger = Logger.getInstance('AgroMap-Backend');

// Middleware pour logger les requêtes
export const requestLogger = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logApiRequest(req.method, req.originalUrl, res.statusCode, duration);
  });
  
  next();
};

// Helper pour logger les performances
export const logPerformance = (operation: string, threshold: number = 1000) => {
  return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = Date.now();
      try {
        const result = await method.apply(this, args);
        const duration = Date.now() - start;
        logger.logPerformanceMetric(`${operation}:${propertyName}`, duration, threshold);
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.logPerformanceMetric(`${operation}:${propertyName}:ERROR`, duration, threshold);
        throw error;
      }
    };
  };
};

export default logger;