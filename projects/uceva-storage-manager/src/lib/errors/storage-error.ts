import { StorageErrorCode } from './storage-error-code';

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
