/*
 * Public API Surface of uceva-storage-manager
 */

export type { ICacheStorageService } from './lib/core/interfaces/cache-storage.interface';
export type {
  ILocalStorageService,
  LocalStorageOptions,
} from './lib/core/interfaces/local-storage.interface';
export { StorageError } from './lib/models/storage.models';
export type { StorageErrorCode } from './lib/models/storage.models';
export { CacheStorageService } from './lib/services/cache-storage.service';
export { LocalStorageService } from './lib/services/local-storage.service';
