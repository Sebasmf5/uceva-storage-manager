/*
 * Public API Surface of uceva-storage-manager
 */

export { StorageError } from './lib/models/storage.models';
export type { LocalStorageOptions, StorageErrorCode } from './lib/models/storage.models';
export { CacheStorageService } from './lib/services/cache-storage.service';
export { LocalStorageService } from './lib/services/local-storage.service';
