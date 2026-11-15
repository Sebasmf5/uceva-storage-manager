import * as api from './public-api';

describe('public-api', () => {
  it('debe exponer únicamente los símbolos públicos en tiempo de ejecución', () => {
    expect(Object.keys(api).sort()).toEqual([
      'CacheStorageService',
      'LocalStorageService',
      'StorageError',
    ]);
  });
});
