import { Injectable } from '@angular/core';
import {
  assertValidCacheName,
  assertValidRequest,
  getNativeCacheStorage,
  wrapCacheError,
} from '../core/cache-utils';
import { deserializeValue, serializeValue } from '../core/storage-utils';
import { StorageError } from '../models/storage.models';

/**
 * Servicio Angular para administrar cachés y recursos HTTP mediante la API
 * nativa `Cache Storage` del navegador.
 */
@Injectable({
  providedIn: 'root',
})
export class CacheStorageService {
  /**
   * Abre (o crea si no existe) una caché con el nombre indicado.
   *
   * @param cacheName Nombre identificador de la caché.
   * @returns Promesa con la instancia de {@link Cache} abierta.
   * @throws {StorageError} Si el nombre es inválido o `Cache Storage` falla.
   */
  async openCache(cacheName: string): Promise<Cache> {
    const validName = assertValidCacheName(cacheName);
    const cacheStorage = getNativeCacheStorage();
    try {
      return await cacheStorage.open(validName);
    } catch (error) {
      throw wrapCacheError(`No fue posible abrir la caché "${validName}".`, error);
    }
  }

  /**
   * Abre una caché únicamente si ya existe en `Cache Storage`, sin crearla.
   *
   * @param cacheName Nombre identificador de la caché.
   * @returns Promesa con la instancia de {@link Cache} o `null` si no existe.
   * @throws {StorageError} Si el nombre es inválido o `Cache Storage` falla.
   */
  private async openExistingCache(cacheName: string): Promise<Cache | null> {
    const validName = assertValidCacheName(cacheName);
    const cacheStorage = getNativeCacheStorage();
    try {
      const exists = await cacheStorage.has(validName);
      if (!exists) {
        return null;
      }
      return await cacheStorage.open(validName);
    } catch (error) {
      throw wrapCacheError(`No fue posible acceder a la caché "${validName}".`, error);
    }
  }

  /**
   * Verifica si existe una caché con el nombre especificado.
   *
   * @param cacheName Nombre de la caché a consultar.
   * @returns Promesa que resuelve en `true` si la caché existe, o `false` en caso contrario.
   */
  async hasCache(cacheName: string): Promise<boolean> {
    const validName = assertValidCacheName(cacheName);
    const cacheStorage = getNativeCacheStorage();
    try {
      return await cacheStorage.has(validName);
    } catch (error) {
      throw wrapCacheError(`No fue posible verificar la caché "${validName}".`, error);
    }
  }

  /**
   * Lista los nombres de todas las cachés registradas en `Cache Storage`.
   *
   * @returns Promesa con el arreglo de nombres de cachés existentes.
   */
  async listCaches(): Promise<string[]> {
    const cacheStorage = getNativeCacheStorage();
    try {
      return await cacheStorage.keys();
    } catch (error) {
      throw wrapCacheError('No fue posible listar las cachés disponibles.', error);
    }
  }

  /**
   * Almacena una respuesta HTTP asociada a una solicitud o URL dentro de la caché indicada.
   * Si la caché no existe, la crea automáticamente.
   *
   * @param cacheName Nombre de la caché destino.
   * @param request Solicitud o URL clave del recurso.
   * @param response Objeto {@link Response} a almacenar.
   * @throws {StorageError} Si la respuesta es inválida o falla la escritura en caché.
   */
  async put(cacheName: string, request: RequestInfo | URL, response: Response): Promise<void> {
    const validRequest = assertValidRequest(request);
    if (!response) {
      throw new StorageError('CACHE_OPERATION_ERROR', 'La respuesta HTTP a almacenar es inválida.');
    }
    const cache = await this.openCache(cacheName);
    try {
      await cache.put(validRequest, response);
    } catch (error) {
      throw wrapCacheError(
        `No fue posible almacenar el recurso en la caché "${cacheName.trim()}".`,
        error,
      );
    }
  }

  /**
   * Serializa un valor JSON y lo almacena como una respuesta HTTP en la caché indicada.
   * Si la caché no existe, la crea automáticamente.
   *
   * @typeParam T Tipo del dato a almacenar.
   * @param cacheName Nombre de la caché destino.
   * @param request Solicitud o URL clave del recurso.
   * @param data Valor serializable a guardar en el cuerpo de la respuesta.
   * @param init Opciones adicionales de {@link ResponseInit} (estado, cabeceras, etc.).
   */
  async putJson<T>(
    cacheName: string,
    request: RequestInfo | URL,
    data: T,
    init?: ResponseInit,
  ): Promise<void> {
    const serialized = serializeValue(data);
    const headers = new Headers(init?.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = new Response(serialized, {
      status: init?.status ?? 200,
      statusText: init?.statusText ?? 'OK',
      headers,
    });

    await this.put(cacheName, request, response);
  }

  /**
   * Busca una respuesta HTTP almacenada en la caché indicada sin crear la caché si no existe.
   *
   * @param cacheName Nombre de la caché a consultar.
   * @param request Solicitud o URL del recurso buscado.
   * @param options Opciones opcionales de coincidencia {@link CacheQueryOptions}.
   * @returns Promesa con la {@link Response} encontrada, o `undefined` si el recurso o la caché no existen.
   */
  async match(
    cacheName: string,
    request: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<Response | undefined> {
    const validRequest = assertValidRequest(request);
    const cache = await this.openExistingCache(cacheName);
    if (!cache) {
      return undefined;
    }
    try {
      return await cache.match(validRequest, options);
    } catch (error) {
      throw wrapCacheError(
        `No fue posible consultar el recurso en la caché "${cacheName.trim()}".`,
        error,
      );
    }
  }

  /**
   * Busca un recurso almacenado en caché y deserializa su cuerpo JSON, sin crear la caché si no existe.
   *
   * @typeParam T Tipo esperado del objeto JSON almacenado.
   * @param cacheName Nombre de la caché a consultar.
   * @param request Solicitud o URL del recurso buscado.
   * @param options Opciones opcionales de coincidencia {@link CacheQueryOptions}.
   * @returns Promesa con el valor deserializado, o `null` si el recurso o la caché no existen.
   * @throws {StorageError} Con código `DESERIALIZATION_ERROR` si el cuerpo no es JSON válido.
   */
  async matchJson<T>(
    cacheName: string,
    request: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<T | null> {
    const response = await this.match(cacheName, request, options);
    if (!response) {
      return null;
    }

    const text = await response.text();
    return deserializeValue<T>(text);
  }

  /**
   * Lista las URLs de todos los recursos almacenados dentro de una caché, sin crearla si no existe.
   *
   * @param cacheName Nombre de la caché a inspeccionar.
   * @returns Promesa con el arreglo de URLs almacenadas, o `[]` si la caché no existe.
   */
  async listEntries(cacheName: string): Promise<string[]> {
    const cache = await this.openExistingCache(cacheName);
    if (!cache) {
      return [];
    }
    try {
      const requests = await cache.keys();
      return requests.map((req) => req.url);
    } catch (error) {
      throw wrapCacheError(
        `No fue posible listar las entradas de la caché "${cacheName.trim()}".`,
        error,
      );
    }
  }

  /**
   * Elimina un recurso específico de la caché indicada, sin crear la caché si no existe.
   *
   * @param cacheName Nombre de la caché.
   * @param request Solicitud o URL del recurso a eliminar.
   * @param options Opciones opcionales de coincidencia {@link CacheQueryOptions}.
   * @returns Promesa con `true` si el recurso existía y fue eliminado; `false` si el recurso o la caché no existen.
   */
  async deleteEntry(
    cacheName: string,
    request: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<boolean> {
    const validRequest = assertValidRequest(request);
    const cache = await this.openExistingCache(cacheName);
    if (!cache) {
      return false;
    }
    try {
      return await cache.delete(validRequest, options);
    } catch (error) {
      throw wrapCacheError(
        `No fue posible eliminar el recurso de la caché "${cacheName.trim()}".`,
        error,
      );
    }
  }

  /**
   * Elimina por completo una caché y todo su contenido.
   *
   * @param cacheName Nombre de la caché a eliminar.
   * @returns Promesa con `true` si la caché existía y fue eliminada; `false` en caso contrario.
   */
  async deleteCache(cacheName: string): Promise<boolean> {
    const validName = assertValidCacheName(cacheName);
    const cacheStorage = getNativeCacheStorage();
    try {
      return await cacheStorage.delete(validName);
    } catch (error) {
      throw wrapCacheError(`No fue posible eliminar la caché "${validName}".`, error);
    }
  }

  /**
   * Elimina todas las cachés registradas en `Cache Storage`.
   *
   * @returns Promesa con la cantidad de cachés eliminadas.
   */
  async clearAllCaches(): Promise<number> {
    const names = await this.listCaches();
    let deletedCount = 0;
    for (const name of names) {
      const deleted = await this.deleteCache(name);
      if (deleted) {
        deletedCount++;
      }
    }
    return deletedCount;
  }
}
