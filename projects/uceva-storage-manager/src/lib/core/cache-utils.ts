import { StorageError } from '../models/storage.models';

/**
 * Obtiene la referencia nativa a `caches` (Cache Storage API) verificando su disponibilidad.
 *
 * @internal
 * @returns Instancia de {@link CacheStorage} del navegador.
 * @throws {StorageError} Si Cache Storage no está disponible en el entorno actual.
 */
export function getNativeCacheStorage(): CacheStorage {
  try {
    const cacheStorage = globalThis.caches;
    if (!cacheStorage) {
      throw new StorageError(
        'STORAGE_UNAVAILABLE',
        'Cache Storage no está disponible en este entorno.',
      );
    }
    return cacheStorage;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      'El acceso a Cache Storage fue denegado o no está disponible.',
      error,
    );
  }
}

/**
 * Valida que el nombre de una caché sea una cadena no vacía.
 *
 * @internal
 * @param cacheName Nombre de la caché a validar.
 * @returns Nombre de caché normalizado sin espacios extremos.
 * @throws {StorageError} Con código `INVALID_CACHE_NAME` si el nombre es inválido.
 */
export function assertValidCacheName(cacheName: string): string {
  if (typeof cacheName !== 'string' || cacheName.trim().length === 0) {
    throw new StorageError(
      'INVALID_CACHE_NAME',
      'El nombre de la caché debe ser una cadena no vacía.',
    );
  }
  return cacheName.trim();
}

/**
 * Valida que el identificador de recurso (`Request`, `URL` o cadena) sea válido.
 *
 * @internal
 * @param request Recurso o URL a validar.
 * @returns El mismo recurso validado (o recortado si es cadena).
 * @throws {StorageError} Con código `INVALID_REQUEST` si el recurso es nulo o vacío.
 */
export function assertValidRequest(request: RequestInfo | URL): RequestInfo | URL {
  if (request === null || request === undefined) {
    throw new StorageError('INVALID_REQUEST', 'La solicitud o URL no puede ser nula.');
  }
  if (typeof request === 'string') {
    if (request.trim().length === 0) {
      throw new StorageError('INVALID_REQUEST', 'La URL de la solicitud no puede estar vacía.');
    }
    return request.trim();
  }
  return request;
}

/**
 * Envuelve errores inesperados de operaciones de Cache Storage en un {@link StorageError}.
 *
 * @internal
 * @param message Mensaje descriptivo de la operación fallida.
 * @param error Error original capturado.
 * @returns Instancia de {@link StorageError}.
 */
export function wrapCacheError(message: string, error: unknown): StorageError {
  if (error instanceof StorageError) {
    return error;
  }
  return new StorageError('CACHE_OPERATION_ERROR', message, error);
}
