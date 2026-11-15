import { Injectable } from '@angular/core';
import {
  buildPrefixedKey,
  deserializeValue,
  getNativeLocalStorage,
  isQuotaExceededError,
  serializeValue,
} from '../core/storage-utils';
import { LocalStorageOptions, StorageError } from '../models/storage.models';

/**
 * Servicio Angular para gestionar el almacenamiento persistente en `LocalStorage`
 * mediante una API tipada, con serialización JSON automática y manejo de errores.
 */
@Injectable({
  providedIn: 'root',
})
export class LocalStorageService {
  /**
   * Almacena un valor primitivo u objeto en `LocalStorage` serializándolo como JSON.
   *
   * @typeParam T Tipo del valor a almacenar.
   * @param key Clave identificadora del registro.
   * @param value Valor primitivo u objeto serializable a almacenar.
   * @param options Opciones opcionales como prefijo de espacio de nombres.
   * @throws {StorageError} Si la clave es inválida, el valor no es serializable,
   * `LocalStorage` no está disponible o se excede la cuota de almacenamiento.
   */
  set<T>(key: string, value: T, options?: LocalStorageOptions): void {
    const storage = getNativeLocalStorage();
    const resolvedKey = buildPrefixedKey(key, options?.prefix);
    const serialized = serializeValue(value);

    try {
      storage.setItem(resolvedKey, serialized);
    } catch (error) {
      if (isQuotaExceededError(error)) {
        throw new StorageError(
          'QUOTA_EXCEEDED',
          `Se excedió la cuota de LocalStorage al guardar la clave "${resolvedKey}".`,
          error,
        );
      }
      throw new StorageError(
        'STORAGE_UNAVAILABLE',
        `No fue posible escribir la clave "${resolvedKey}" en LocalStorage.`,
        error,
      );
    }
  }

  /**
   * Consulta y deserializa un valor almacenado en `LocalStorage`.
   *
   * @typeParam T Tipo esperado del valor recuperado.
   * @param key Clave del registro a consultar.
   * @param options Opciones opcionales como prefijo de espacio de nombres.
   * @returns El valor deserializado o `null` si la clave no existe.
   * @throws {StorageError} Si la clave es inválida, `LocalStorage` no está disponible
   * o el contenido almacenado no es JSON válido.
   */
  get<T>(key: string, options?: LocalStorageOptions): T | null {
    const storage = getNativeLocalStorage();
    const resolvedKey = buildPrefixedKey(key, options?.prefix);
    const raw = storage.getItem(resolvedKey);

    if (raw === null) {
      return null;
    }

    return deserializeValue<T>(raw);
  }

  /**
   * Consulta un valor almacenado en `LocalStorage` y retorna un valor por defecto
   * cuando la clave no existe.
   *
   * @typeParam T Tipo esperado del valor.
   * @param key Clave del registro a consultar.
   * @param defaultValue Valor de respaldo a retornar si la clave no existe.
   * @param options Opciones opcionales como prefijo de espacio de nombres.
   * @returns El valor almacenado o `defaultValue` si la clave no existe.
   */
  getOrDefault<T>(key: string, defaultValue: T, options?: LocalStorageOptions): T {
    const value = this.get<T>(key, options);
    return value === null ? defaultValue : value;
  }

  /**
   * Actualiza un registro existente en `LocalStorage` aplicando una función transformadora.
   *
   * @typeParam T Tipo del valor almacenado.
   * @param key Clave del registro a actualizar.
   * @param updater Función que recibe el valor actual y retorna el nuevo valor.
   * @param options Opciones opcionales como prefijo de espacio de nombres.
   * @returns El nuevo valor almacenado tras la actualización.
   * @throws {StorageError} Con código `KEY_NOT_FOUND` si la clave no existe previamente.
   */
  update<T>(key: string, updater: (current: T) => T, options?: LocalStorageOptions): T {
    const current = this.get<T>(key, options);
    if (current === null) {
      const resolvedKey = buildPrefixedKey(key, options?.prefix);
      throw new StorageError(
        'KEY_NOT_FOUND',
        `No existe un registro para la clave "${resolvedKey}" en LocalStorage.`,
      );
    }

    const updated = updater(current);
    this.set<T>(key, updated, options);
    return updated;
  }

  /**
   * Verifica si existe un registro para la clave indicada en `LocalStorage`.
   *
   * @param key Clave a verificar.
   * @param options Opciones opcionales como prefijo de espacio de nombres.
   * @returns `true` si la clave existe, `false` en caso contrario.
   */
  has(key: string, options?: LocalStorageOptions): boolean {
    const storage = getNativeLocalStorage();
    const resolvedKey = buildPrefixedKey(key, options?.prefix);
    return storage.getItem(resolvedKey) !== null;
  }

  /**
   * Elimina un registro específico de `LocalStorage`.
   *
   * @param key Clave del registro a eliminar.
   * @param options Opciones opcionales como prefijo de espacio de nombres.
   * @returns `true` si la clave existía y fue eliminada; `false` si no existía.
   */
  remove(key: string, options?: LocalStorageOptions): boolean {
    const storage = getNativeLocalStorage();
    const resolvedKey = buildPrefixedKey(key, options?.prefix);
    const existed = storage.getItem(resolvedKey) !== null;
    storage.removeItem(resolvedKey);
    return existed;
  }

  /**
   * Lista todas las claves almacenadas en `LocalStorage`. Si se proporciona un prefijo,
   * devuelve únicamente las claves pertenecientes a ese prefijo sin el prefijo incluido.
   *
   * @param prefix Prefijo opcional para filtrar claves por espacio de nombres.
   * @returns Arreglo de claves encontradas.
   */
  keys(prefix?: string): string[] {
    const storage = getNativeLocalStorage();
    const normalizedPrefix =
      typeof prefix === 'string' && prefix.trim().length > 0 ? `${prefix.trim()}:` : null;

    const result: string[] = [];
    for (let index = 0; index < storage.length; index++) {
      const currentKey = storage.key(index);
      if (currentKey === null) {
        continue;
      }
      if (normalizedPrefix === null) {
        result.push(currentKey);
      } else if (currentKey.startsWith(normalizedPrefix)) {
        result.push(currentKey.slice(normalizedPrefix.length));
      }
    }
    return result;
  }

  /**
   * Retorna la cantidad de registros almacenados en `LocalStorage`, opcionalmente
   * filtrados por prefijo.
   *
   * @param prefix Prefijo opcional de espacio de nombres.
   * @returns Número de claves almacenadas.
   */
  size(prefix?: string): number {
    return this.keys(prefix).length;
  }

  /**
   * Elimina todos los registros de `LocalStorage`, o únicamente los que pertenezcan
   * al prefijo indicado.
   *
   * @param prefix Prefijo opcional para limpiar solo un espacio de nombres.
   */
  clear(prefix?: string): void {
    const storage = getNativeLocalStorage();
    const normalizedPrefix =
      typeof prefix === 'string' && prefix.trim().length > 0 ? `${prefix.trim()}:` : null;

    if (normalizedPrefix === null) {
      storage.clear();
      return;
    }

    const keysToDelete = this.keys(prefix);
    for (const key of keysToDelete) {
      storage.removeItem(`${normalizedPrefix}${key}`);
    }
  }
}
