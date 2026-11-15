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

/**
 * Error tipado lanzado por los servicios de `uceva-storage-manager` cuando ocurre
 * una falla controlada durante operaciones de almacenamiento o consulta.
 */
export class StorageError extends Error {
  /**
   * Crea una nueva instancia de {@link StorageError}.
   *
   * @param code Código identificador del tipo de error.
   * @param message Descripción legible del error ocurrido.
   * @param cause Error original subyacente, si existe.
   */
  constructor(
    public readonly code: StorageErrorCode,
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
