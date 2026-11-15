import { TestBed } from '@angular/core/testing';
import { StorageError } from '../models/storage.models';
import { isQuotaExceededError } from '../core/storage-utils';
import { LocalStorageService } from './local-storage.service';

interface UserProfile {
  id: number;
  name: string;
  roles: string[];
}

describe('LocalStorageService', () => {
  let service: LocalStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(LocalStorageService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
  });

  it('debe crearse correctamente', () => {
    expect(service).toBeTruthy();
  });

  describe('set y get', () => {
    it('debe almacenar y recuperar valores primitivos', () => {
      service.set('cadena', 'hola uceva');
      service.set('numero', 42);
      service.set('booleano', true);
      service.set('nulo', null);

      expect(service.get<string>('cadena')).toBe('hola uceva');
      expect(service.get<number>('numero')).toBe(42);
      expect(service.get<boolean>('booleano')).toBe(true);
      expect(service.get<null>('nulo')).toBeNull();
    });

    it('debe almacenar y recuperar objetos complejos mediante JSON', () => {
      const profile: UserProfile = { id: 1, name: 'Ana', roles: ['admin', 'editor'] };
      service.set('profile', profile);

      expect(service.get<UserProfile>('profile')).toEqual(profile);
    });

    it('debe aislar claves usando prefijo cuando se especifica', () => {
      service.set('token', 'abc', { prefix: ' auth ' });
      service.set('token', 'xyz', { prefix: 'other' });

      expect(localStorage.getItem('auth:token')).toBe('"abc"');
      expect(service.get<string>('token', { prefix: 'auth' })).toBe('abc');
      expect(service.get<string>('token', { prefix: 'other' })).toBe('xyz');
    });

    it('debe retornar null cuando la clave no existe', () => {
      expect(service.get('inexistente')).toBeNull();
    });
  });

  describe('getOrDefault', () => {
    it('debe retornar el valor almacenado si la clave existe', () => {
      service.set('tema', 'oscuro');
      expect(service.getOrDefault('tema', 'claro')).toBe('oscuro');
    });

    it('debe retornar el valor por defecto si la clave no existe', () => {
      expect(service.getOrDefault('tema', 'claro')).toBe('claro');
    });
  });

  describe('update', () => {
    it('debe actualizar un registro existente y retornar el nuevo valor', () => {
      service.set('contador', 10);
      const result = service.update<number>('contador', (val) => val + 5);

      expect(result).toBe(15);
      expect(service.get<number>('contador')).toBe(15);
    });

    it('debe lanzar StorageError KEY_NOT_FOUND si la clave no existe', () => {
      expect(() => service.update<number>('no-existe', (v) => v + 1)).toThrow(StorageError);
      try {
        service.update<number>('no-existe', (v) => v + 1);
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).code).toBe('KEY_NOT_FOUND');
      }
    });
  });

  describe('has, remove, keys, size y clear', () => {
    it('debe verificar existencia con has y eliminar con remove', () => {
      service.set('item', 123);
      expect(service.has('item')).toBe(true);

      expect(service.remove('item')).toBe(true);
      expect(service.has('item')).toBe(false);
      expect(service.remove('item')).toBe(false);
    });

    it('debe listar claves, calcular size y limpiar todas o por prefijo', () => {
      service.set('a', 1, { prefix: 'app' });
      service.set('b', 2, { prefix: 'app' });
      service.set('c', 3);

      expect(service.keys()).toEqual(['app:a', 'app:b', 'c']);
      expect(service.keys('app')).toEqual(['a', 'b']);
      expect(service.size()).toBe(3);
      expect(service.size('app')).toBe(2);

      service.clear('app');
      expect(service.size('app')).toBe(0);
      expect(service.has('c')).toBe(true);

      service.clear();
      expect(service.size()).toBe(0);
    });

    it('debe omitir claves nulas devueltas por storage.key()', () => {
      jest.spyOn(Storage.prototype, 'length', 'get').mockReturnValue(2);
      jest.spyOn(Storage.prototype, 'key').mockReturnValueOnce(null).mockReturnValueOnce('valida');

      expect(service.keys()).toEqual(['valida']);
    });
  });

  describe('manejo de errores', () => {
    it('debe lanzar INVALID_KEY cuando la clave está vacía o no es string', () => {
      expect(() => service.set('', 'valor')).toThrow(StorageError);
      expect(() => service.get('   ')).toThrow(StorageError);
      expect(() => service.has(null as unknown as string)).toThrow(StorageError);
    });

    it('debe lanzar SERIALIZATION_ERROR para undefined o referencias circulares', () => {
      expect(() => service.set('undef', undefined)).toThrow(StorageError);

      const circular: Record<string, unknown> = {};
      circular['self'] = circular;
      expect(() => service.set('circ', circular)).toThrow(StorageError);
    });

    it('debe lanzar DESERIALIZATION_ERROR si el JSON guardado está corrupto', () => {
      localStorage.setItem('corrupto', '{json-invalido');
      try {
        service.get('corrupto');
        fail('Debió lanzar StorageError');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).code).toBe('DESERIALIZATION_ERROR');
      }
    });

    it('debe lanzar QUOTA_EXCEEDED cuando setItem falla por cuota excedida', () => {
      const quotaError = new DOMException('Quota exceeded', 'QuotaExceededError');
      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw quotaError;
      });

      try {
        service.set('grande', 'data');
        fail('Debió lanzar StorageError');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).code).toBe('QUOTA_EXCEEDED');
      }
    });

    it('debe detectar otros formatos de cuota excedida y errores genéricos de escritura', () => {
      const ffQuota = new DOMException('Quota', 'NS_ERROR_DOM_QUOTA_REACHED');
      expect(isQuotaExceededError(ffQuota)).toBe(true);
      const code22Error = new DOMException('Quota');
      Object.defineProperty(code22Error, 'code', { value: 22 });
      expect(isQuotaExceededError(code22Error)).toBe(true);
      const code1014Error = new DOMException('Quota');
      Object.defineProperty(code1014Error, 'code', { value: 1014 });
      expect(isQuotaExceededError(code1014Error)).toBe(true);
      expect(isQuotaExceededError(new Error('otro'))).toBe(false);

      const originalDOMException = globalThis.DOMException;
      Object.defineProperty(globalThis, 'DOMException', {
        value: undefined,
        configurable: true,
      });
      expect(isQuotaExceededError(ffQuota)).toBe(false);
      Object.defineProperty(globalThis, 'DOMException', {
        value: originalDOMException,
        configurable: true,
      });

      jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('Fallo desconocido');
      });

      try {
        service.set('clave', 'valor');
        fail('Debió lanzar StorageError');
      } catch (error) {
        expect(error).toBeInstanceOf(StorageError);
        expect((error as StorageError).code).toBe('STORAGE_UNAVAILABLE');
      }
    });

    it('debe lanzar STORAGE_UNAVAILABLE cuando localStorage es undefined o lanza excepción al acceder', () => {
      const originalDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

      Object.defineProperty(globalThis, 'localStorage', {
        get: () => undefined,
        configurable: true,
      });
      expect(() => service.get('x')).toThrow(StorageError);

      Object.defineProperty(globalThis, 'localStorage', {
        get: () => {
          throw new Error('Access denied');
        },
        configurable: true,
      });
      expect(() => service.get('x')).toThrow(StorageError);

      if (originalDescriptor) {
        Object.defineProperty(globalThis, 'localStorage', originalDescriptor);
      }
    });
  });
});
