/**
 * Códigos de error estandarizados emitidos por los servicios de almacenamiento.
 */
export type StorageErrorCode =
  | 'STORAGE_UNAVAILABLE'
  | 'INVALID_KEY'
  | 'SERIALIZATION_ERROR'
  | 'DESERIALIZATION_ERROR'
  | 'QUOTA_EXCEEDED'
  | 'KEY_NOT_FOUND'
  | 'INVALID_CACHE_NAME'
  | 'INVALID_REQUEST'
  | 'CACHE_OPERATION_ERROR';
