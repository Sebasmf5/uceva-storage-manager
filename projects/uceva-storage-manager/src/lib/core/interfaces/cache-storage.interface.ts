/**
 * Contrato público para la administración de cachés y recursos HTTP mediante `Cache Storage`.
 */
export interface ICacheStorageService {
  /** Abre o crea una caché con el nombre indicado. */
  openCache(cacheName: string): Promise<Cache>;

  /** Verifica si existe una caché con el nombre indicado. */
  hasCache(cacheName: string): Promise<boolean>;

  /** Lista los nombres de todas las cachés registradas. */
  listCaches(): Promise<string[]>;

  /** Almacena una respuesta HTTP asociada a una solicitud o URL. */
  put(cacheName: string, request: RequestInfo | URL, response: Response): Promise<void>;

  /** Serializa un valor JSON y lo almacena como respuesta HTTP en caché. */
  putJson<T>(
    cacheName: string,
    request: RequestInfo | URL,
    data: T,
    init?: ResponseInit,
  ): Promise<void>;

  /** Busca una respuesta HTTP en caché sin crear la caché si no existe. */
  match(
    cacheName: string,
    request: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<Response | undefined>;

  /** Busca un recurso en caché y deserializa su cuerpo JSON sin crear la caché si no existe. */
  matchJson<T>(
    cacheName: string,
    request: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<T | null>;

  /** Lista las URLs almacenadas en una caché sin crearla si no existe. */
  listEntries(cacheName: string): Promise<string[]>;

  /** Elimina un recurso específico de una caché sin crearla si no existe. */
  deleteEntry(
    cacheName: string,
    request: RequestInfo | URL,
    options?: CacheQueryOptions,
  ): Promise<boolean>;

  /** Elimina por completo una caché y todo su contenido. */
  deleteCache(cacheName: string): Promise<boolean>;

  /** Elimina todas las cachés registradas y retorna la cantidad eliminada. */
  clearAllCaches(): Promise<number>;
}
