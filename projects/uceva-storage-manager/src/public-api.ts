/**
 * Este archivo es la única superficie pública de la librería `uceva-storage-manager`.
 * Expone exclusivamente los servicios, interfaces, modelos y errores autorizados para
 * consumo externo, manteniendo ocultos los detalles de implementación en `internal/`.
 */

export { StorageError } from './lib/errors';
export type { StorageErrorCode } from './lib/errors';
export type { ICacheStorageService, ILocalStorageService } from './lib/interfaces';
export type { LocalStorageOptions } from './lib/models';
export { CacheStorageService, LocalStorageService } from './lib/services';
