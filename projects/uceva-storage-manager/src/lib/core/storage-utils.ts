import { StorageError } from '../models/storage.models';

/**
 * Valida que una clave de almacenamiento sea una cadena no vacía.
 *
 * @internal
 * @param key Clave a validar.
 * @returns La clave validada sin espacios extremos.
 * @throws {StorageError} Si la clave no es una cadena válida o está vacía.
 */
export function assertValidKey(key: string): string {
  if (typeof key !== 'string' || key.trim().length === 0) {
    throw new StorageError('INVALID_KEY', 'La clave de almacenamiento debe ser una cadena no vacía.');
  }
  return key.trim();
}

/**
 * Construye la clave final aplicando un prefijo opcional.
 *
 * @internal
 * @param key Clave base ya validada.
 * @param prefix Prefijo opcional de espacio de nombres.
 * @returns Clave compuesta para almacenamiento.
 */
export function buildPrefixedKey(key: string, prefix?: string): string {
  const cleanKey = assertValidKey(key);
  if (typeof prefix === 'string' && prefix.trim().length > 0) {
    return `${prefix.trim()}:${cleanKey}`;
  }
  return cleanKey;
}

/**
 * Serializa un valor primitivo u objeto a formato JSON.
 *
 * @internal
 * @typeParam T Tipo del valor a serializar.
 * @param value Valor a convertir en cadena JSON.
 * @returns Representación JSON del valor.
 * @throws {StorageError} Si el valor es `undefined` o no puede serializarse.
 */
export function serializeValue<T>(value: T): string {
  if (value === undefined) {
    throw new StorageError(
      'SERIALIZATION_ERROR',
      'No es posible almacenar un valor undefined en LocalStorage.',
    );
  }
  try {
    return JSON.stringify(value);
  } catch (error) {
    throw new StorageError(
      'SERIALIZATION_ERROR',
      'No fue posible serializar el valor a JSON.',
      error,
    );
  }
}

/**
 * Deserializa una cadena JSON al tipo esperado.
 *
 * @internal
 * @typeParam T Tipo esperado del valor deserializado.
 * @param raw Cadena JSON almacenada.
 * @returns Valor deserializado.
 * @throws {StorageError} Si la cadena no contiene un JSON válido.
 */
export function deserializeValue<T>(raw: string): T {
  try {
    return JSON.parse(raw) as T;
  } catch (error) {
    throw new StorageError(
      'DESERIALIZATION_ERROR',
      'El valor almacenado no tiene un formato JSON válido.',
      error,
    );
  }
}

/**
 * Determina si un error corresponde a una cuota de almacenamiento excedida.
 *
 * @internal
 * @param error Error capturado al escribir en almacenamiento.
 * @returns `true` si el error corresponde a cuota excedida.
 */
export function isQuotaExceededError(error: unknown): boolean {
  if (typeof DOMException !== 'undefined' && error instanceof DOMException) {
    return (
      error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014
    );
  }
  return false;
}

/**
 * Obtiene la referencia nativa a `localStorage` verificando su disponibilidad.
 *
 * @internal
 * @returns Instancia de {@link Storage} del navegador.
 * @throws {StorageError} Si `localStorage` no está disponible en el entorno actual.
 */
export function getNativeLocalStorage(): Storage {
  try {
    const storage = globalThis.localStorage;
    if (!storage) {
      throw new StorageError(
        'STORAGE_UNAVAILABLE',
        'LocalStorage no está disponible en este entorno.',
      );
    }
    return storage;
  } catch (error) {
    if (error instanceof StorageError) {
      throw error;
    }
    throw new StorageError(
      'STORAGE_UNAVAILABLE',
      'El acceso a LocalStorage fue denegado o no está disponible.',
      error,
    );
  }
}
