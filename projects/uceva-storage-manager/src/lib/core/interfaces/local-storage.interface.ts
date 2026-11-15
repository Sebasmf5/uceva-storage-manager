/**
 * Opciones de configuración por operación para {@link LocalStorageService}.
 */
export interface LocalStorageOptions {
  /**
   * Prefijo opcional aplicado a la clave para aislar espacios de nombres.
   */
  prefix?: string;
}

/**
 * Contrato público para la gestión tipada de almacenamiento en `LocalStorage`.
 */
export interface ILocalStorageService {
  /** Almacena un valor primitivo u objeto serializado como JSON. */
  set<T>(key: string, value: T, options?: LocalStorageOptions): void;

  /** Consulta y deserializa un valor almacenado, o retorna `null` si no existe. */
  get<T>(key: string, options?: LocalStorageOptions): T | null;

  /** Consulta un valor almacenado o retorna `defaultValue` si no existe o vale `null`. */
  getOrDefault<T>(key: string, defaultValue: T, options?: LocalStorageOptions): T;

  /** Actualiza un registro existente mediante una función transformadora. */
  update<T>(key: string, updater: (current: T) => T, options?: LocalStorageOptions): T;

  /** Verifica si existe una clave registrada en `LocalStorage`. */
  has(key: string, options?: LocalStorageOptions): boolean;

  /** Elimina una clave específica y retorna `true` si existía. */
  remove(key: string, options?: LocalStorageOptions): boolean;

  /** Lista las claves almacenadas, opcionalmente filtradas por prefijo. */
  keys(prefix?: string): string[];

  /** Retorna la cantidad de claves almacenadas, opcionalmente filtradas por prefijo. */
  size(prefix?: string): number;

  /** Elimina todas las claves o únicamente las asociadas al prefijo indicado. */
  clear(prefix?: string): void;
}
