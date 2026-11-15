import { TestBed } from '@angular/core/testing';
import { StorageError } from '../models/storage.models';
import { CacheStorageService } from './cache-storage.service';

interface MockResponse {
  status: number;
  statusText: string;
  headers: Headers;
  bodyText: string;
  text: () => Promise<string>;
}

function createMockResponse(body: string, init?: ResponseInit): MockResponse {
  const headers = new Headers(init?.headers);
  return {
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    headers,
    bodyText: body,
    text: async () => body,
  };
}

function createInMemoryCacheStorage(): CacheStorage {
  const stores = new Map<string, Map<string, Response>>();

  const getUrl = (request: RequestInfo | URL): string => {
    if (typeof request === 'string') {
      return request;
    }
    if (request instanceof URL) {
      return request.toString();
    }
    return request.url;
  };

  return {
    open: async (cacheName: string): Promise<Cache> => {
      if (!stores.has(cacheName)) {
        stores.set(cacheName, new Map<string, Response>());
      }
      const cacheMap = stores.get(cacheName)!;

      return {
        put: async (req: RequestInfo | URL, res: Response): Promise<void> => {
          cacheMap.set(getUrl(req), res);
        },
        match: async (req: RequestInfo | URL): Promise<Response | undefined> => {
          return cacheMap.get(getUrl(req));
        },
        keys: async (): Promise<readonly Request[]> => {
          return Array.from(cacheMap.keys()).map((url) => ({ url }) as Request);
        },
        delete: async (req: RequestInfo | URL): Promise<boolean> => {
          return cacheMap.delete(getUrl(req));
        },
      } as unknown as Cache;
    },
    has: async (cacheName: string): Promise<boolean> => stores.has(cacheName),
    keys: async (): Promise<string[]> => Array.from(stores.keys()),
    delete: async (cacheName: string): Promise<boolean> => stores.delete(cacheName),
    match: async (): Promise<Response | undefined> => undefined,
  } as unknown as CacheStorage;
}

describe('CacheStorageService', () => {
  let service: CacheStorageService;
  let mockCacheStorage: CacheStorage;
  const originalCachesDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'caches');
  const originalResponse = globalThis.Response;

  beforeEach(() => {
    mockCacheStorage = createInMemoryCacheStorage();
    Object.defineProperty(globalThis, 'caches', {
      value: mockCacheStorage,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(globalThis, 'Response', {
      value: class {
        status: number;
        statusText: string;
        headers: Headers;
        private readonly body: string;
        constructor(body: string, init?: ResponseInit) {
          this.body = body;
          this.status = init?.status ?? 200;
          this.statusText = init?.statusText ?? 'OK';
          this.headers = new Headers(init?.headers);
        }
        async text(): Promise<string> {
          return this.body;
        }
      },
      configurable: true,
      writable: true,
    });

    TestBed.configureTestingModule({});
    service = TestBed.inject(CacheStorageService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalCachesDescriptor) {
      Object.defineProperty(globalThis, 'caches', originalCachesDescriptor);
    } else {
      delete (globalThis as Record<string, unknown>)['caches'];
    }
    Object.defineProperty(globalThis, 'Response', {
      value: originalResponse,
      configurable: true,
      writable: true,
    });
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('administración de cachés', () => {
    it('debe abrir, verificar existencia y listar cachés', async () => {
      expect(await service.hasCache('api-v1')).toBe(false);

      const cache = await service.openCache(' api-v1 ');
      expect(cache).toBeDefined();
      expect(await service.hasCache('api-v1')).toBe(true);
      expect(await service.listCaches()).toEqual(['api-v1']);
    });

    it('debe eliminar una caché específica y limpiar todas las cachés', async () => {
      await service.openCache('cache-a');
      await service.openCache('cache-b');

      expect(await service.deleteCache('cache-a')).toBe(true);
      expect(await service.deleteCache('cache-a')).toBe(false);
      expect(await service.listCaches()).toEqual(['cache-b']);

      await service.openCache('cache-c');
      const deletedCount = await service.clearAllCaches();
      expect(deletedCount).toBe(2);
      expect(await service.listCaches()).toEqual([]);
    });

    it('debe manejar cuando deleteCache retorna false dentro de clearAllCaches', async () => {
      jest.spyOn(mockCacheStorage, 'keys').mockResolvedValue(['fantasma']);
      jest.spyOn(mockCacheStorage, 'delete').mockResolvedValue(false);

      expect(await service.clearAllCaches()).toBe(0);
    });
  });

  describe('almacenamiento, consulta y eliminación de recursos', () => {
    it('debe almacenar y consultar una Response con put y match', async () => {
      const response = createMockResponse('contenido') as unknown as Response;
      await service.put('assets', '/api/datos', response);

      const found = await service.match('assets', '/api/datos');
      expect(found).toBe(response);
      expect(await service.match('assets', '/api/no-existe')).toBeUndefined();
    });

    it('debe almacenar y recuperar objetos JSON con putJson y matchJson', async () => {
      const payload = { curso: 'Arquitectura', nota: 5.0 };
      await service.putJson('api-cache', 'https://uceva.edu.co/curso', payload);

      const result = await service.matchJson<typeof payload>(
        'api-cache',
        new URL('https://uceva.edu.co/curso'),
      );
      expect(result).toEqual(payload);
      expect(await service.matchJson('api-cache', '/sin-registro')).toBeNull();
    });

    it('debe respetar Content-Type personalizado en putJson', async () => {
      await service.putJson(
        'api-cache',
        '/custom',
        { ok: true },
        {
          status: 201,
          statusText: 'Created',
          headers: { 'Content-Type': 'application/vnd.api+json' },
        },
      );

      const stored = await service.match('api-cache', '/custom');
      expect(stored?.status).toBe(201);
      expect(stored?.headers.get('Content-Type')).toBe('application/vnd.api+json');
    });

    it('debe listar entradas y eliminar un recurso específico con deleteEntry', async () => {
      await service.putJson('datos', '/uno', { id: 1 });
      await service.putJson('datos', '/dos', { id: 2 });

      expect(await service.listEntries('datos')).toEqual(['/uno', '/dos']);
      expect(await service.deleteEntry('datos', '/uno')).toBe(true);
      expect(await service.deleteEntry('datos', '/uno')).toBe(false);
      expect(await service.listEntries('datos')).toEqual(['/dos']);
    });
  });

  describe('manejo de errores', () => {
    it('debe lanzar INVALID_CACHE_NAME cuando el nombre de caché es vacío o inválido', async () => {
      await expect(service.openCache('')).rejects.toMatchObject({ code: 'INVALID_CACHE_NAME' });
      await expect(service.hasCache('   ')).rejects.toMatchObject({ code: 'INVALID_CACHE_NAME' });
      await expect(service.deleteCache(null as unknown as string)).rejects.toMatchObject({
        code: 'INVALID_CACHE_NAME',
      });
    });

    it('debe lanzar INVALID_REQUEST cuando la solicitud o URL es nula o vacía', async () => {
      await expect(
        service.put('c', '', createMockResponse('') as unknown as Response),
      ).rejects.toMatchObject({ code: 'INVALID_REQUEST' });
      await expect(service.match('c', null as unknown as string)).rejects.toMatchObject({
        code: 'INVALID_REQUEST',
      });
      await expect(service.deleteEntry('c', undefined as unknown as string)).rejects.toMatchObject({
        code: 'INVALID_REQUEST',
      });
    });

    it('debe lanzar CACHE_OPERATION_ERROR si se intenta guardar una Response nula', async () => {
      await expect(service.put('c', '/ok', null as unknown as Response)).rejects.toMatchObject({
        code: 'CACHE_OPERATION_ERROR',
      });
    });

    it('debe lanzar DESERIALIZATION_ERROR si matchJson encuentra JSON inválido', async () => {
      await service.put('c', '/bad-json', createMockResponse('{malo') as unknown as Response);
      await expect(service.matchJson('c', '/bad-json')).rejects.toMatchObject({
        code: 'DESERIALIZATION_ERROR',
      });
    });

    it('debe envolver errores nativos de CacheStorage y Cache como CACHE_OPERATION_ERROR', async () => {
      const failingCache = {
        put: jest.fn().mockRejectedValue(new Error('put fail')),
        match: jest.fn().mockRejectedValue(new Error('match fail')),
        keys: jest.fn().mockRejectedValue(new Error('keys fail')),
        delete: jest.fn().mockRejectedValue(new Error('delete fail')),
      } as unknown as Cache;

      jest.spyOn(mockCacheStorage, 'open').mockResolvedValue(failingCache);
      await expect(
        service.put('c', '/x', createMockResponse('a') as unknown as Response),
      ).rejects.toMatchObject({ code: 'CACHE_OPERATION_ERROR' });
      await expect(service.match('c', '/x')).rejects.toMatchObject({
        code: 'CACHE_OPERATION_ERROR',
      });
      await expect(service.listEntries('c')).rejects.toMatchObject({
        code: 'CACHE_OPERATION_ERROR',
      });
      await expect(service.deleteEntry('c', '/x')).rejects.toMatchObject({
        code: 'CACHE_OPERATION_ERROR',
      });

      jest.spyOn(mockCacheStorage, 'open').mockRejectedValue(new Error('open fail'));
      await expect(service.openCache('c')).rejects.toMatchObject({ code: 'CACHE_OPERATION_ERROR' });

      jest.spyOn(mockCacheStorage, 'has').mockRejectedValue(new Error('has fail'));
      await expect(service.hasCache('c')).rejects.toMatchObject({ code: 'CACHE_OPERATION_ERROR' });

      jest.spyOn(mockCacheStorage, 'keys').mockRejectedValue(new Error('keys fail'));
      await expect(service.listCaches()).rejects.toMatchObject({ code: 'CACHE_OPERATION_ERROR' });

      jest.spyOn(mockCacheStorage, 'delete').mockRejectedValue(new Error('del fail'));
      await expect(service.deleteCache('c')).rejects.toMatchObject({
        code: 'CACHE_OPERATION_ERROR',
      });
    });

    it('debe preservar StorageError si ya es una instancia de StorageError en wrapCacheError', async () => {
      const customErr = new StorageError('STORAGE_UNAVAILABLE', 'Sin acceso');
      jest.spyOn(mockCacheStorage, 'open').mockRejectedValue(customErr);
      await expect(service.openCache('c')).rejects.toBe(customErr);
    });

    it('debe lanzar STORAGE_UNAVAILABLE cuando caches es undefined o lanza excepción al acceder', async () => {
      Object.defineProperty(globalThis, 'caches', {
        get: () => undefined,
        configurable: true,
      });
      await expect(service.listCaches()).rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE' });

      Object.defineProperty(globalThis, 'caches', {
        get: () => {
          throw new Error('Blocked');
        },
        configurable: true,
      });
      await expect(service.listCaches()).rejects.toMatchObject({ code: 'STORAGE_UNAVAILABLE' });
    });
  });
});
