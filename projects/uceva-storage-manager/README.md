# UCEVA Storage Manager (`@sebasmf/uceva-storage-manager`)

![Angular](https://img.shields.io/badge/Angular-20.3-dd0031?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)
![Coverage](https://img.shields.io/badge/Coverage-100%25-2ea44f?style=flat-square&logo=jest)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

Librería reutilizable para **Angular** orientada a facilitar la gestión del almacenamiento en aplicaciones web mediante **LocalStorage** y **Cache Storage**, con una API tipada, serialización JSON automática y manejo estandarizado de errores.

---

## Características principales

- **API tipada y consistente:** abstracción completa sobre `window.localStorage` y `window.caches`.
- **Serialización JSON automática:** soporte transparente para primitivos, arreglos y objetos en `LocalStorageService`, además de respuestas HTTP y cargas JSON en `CacheStorageService`.
- **Espacios de nombres por prefijo:** aislamiento de claves en `LocalStorage` mediante `options.prefix`.
- **Manejo controlado de errores:** emisión de `StorageError` con códigos específicos definidos en `StorageErrorCode`.
- **Encapsulamiento estricto:** `public-api.ts` expone únicamente servicios, interfaces, modelos y errores autorizados.
- **Calidad verificada:** pruebas unitarias con Jest al **100% de cobertura** (statements, branches, functions y lines) y documentación técnica generada con **Compodoc**.

---

## Instalación

```bash
npm install @sebasmf/uceva-storage-manager
```

### Requisitos de compatibilidad

- `@angular/core`: `^20.3.0`
- `@angular/common`: `^20.3.0`

---

## Configuración

Los servicios están registrados con `providedIn: 'root'`, por lo que puedes inyectarlos directamente en cualquier componente, servicio o guard mediante `inject()` o el constructor, sin necesidad de importar módulos adicionales:

```typescript
import { inject } from '@angular/core';
import {
  LocalStorageService,
  CacheStorageService,
  ILocalStorageService,
  ICacheStorageService,
  LocalStorageOptions,
  StorageError,
  StorageErrorCode,
} from '@sebasmf/uceva-storage-manager';
```

---

## API Pública expuesta

| Elemento | Tipo | Descripción |
| :--- | :--- | :--- |
| `LocalStorageService` | Servicio | Gestión CRUD, actualización, prefijos y consulta en `LocalStorage`. |
| `CacheStorageService` | Servicio | Administración de cachés, respuestas HTTP y recursos JSON en `Cache Storage`. |
| `ILocalStorageService` | Interfaz | Contrato público implementado por `LocalStorageService`. |
| `ICacheStorageService` | Interfaz | Contrato público implementado por `CacheStorageService`. |
| `LocalStorageOptions` | Interfaz | Opciones por operación (`{ prefix?: string }`). |
| `StorageError` | Clase | Error tipado con propiedad `code: StorageErrorCode` y `cause`. |
| `StorageErrorCode` | Tipo | Unión de códigos de error estandarizados. |

---

## Métodos de `LocalStorageService`

| Método | Qué hace | Qué devuelve |
| :--- | :--- | :--- |
| `set<T>(key, value, options?)` | Almacena un valor primitivo u objeto serializándolo como JSON. | `void` |
| `get<T>(key, options?)` | Consulta y deserializa un valor almacenado en `LocalStorage`. | `T \| null` (`null` si no existe) |
| `getOrDefault<T>(key, defaultValue, options?)` | Consulta un valor y retorna un respaldo si no existe o vale `null`. | `T` |
| `update<T>(key, updater, options?)` | Actualiza un registro existente aplicando una función transformadora. | `T` (nuevo valor almacenado) |
| `has(key, options?)` | Verifica si existe un registro para la clave indicada. | `boolean` |
| `remove(key, options?)` | Elimina un registro específico de `LocalStorage`. | `boolean` (`true` si existía) |
| `keys(prefix?)` | Lista las claves almacenadas (filtradas y sin prefijo si se indica `prefix`). | `string[]` |
| `size(prefix?)` | Cuenta la cantidad de registros almacenados, opcionalmente por prefijo. | `number` |
| `clear(prefix?)` | Elimina todos los registros o solo los pertenecientes al prefijo indicado. | `void` |

> **Nota sobre valores `null`:** si una clave existe almacenada con el valor literal `null`, `getOrDefault` la considera "sin valor" y devuelve `defaultValue`, y `update` lanza `StorageError` con código `KEY_NOT_FOUND`. Para distinguir entre una clave inexistente y una clave cuyo valor guardado es `null`, utiliza `has(key, options?)`.

---

## Métodos de `CacheStorageService`

| Método | Qué hace | Qué devuelve |
| :--- | :--- | :--- |
| `openCache(cacheName)` | Abre una caché existente o la crea si no existe. | `Promise<Cache>` |
| `hasCache(cacheName)` | Verifica si existe una caché con el nombre indicado. | `Promise<boolean>` |
| `listCaches()` | Lista los nombres de todas las cachés registradas en `Cache Storage`. | `Promise<string[]>` |
| `put(cacheName, request, response)` | Almacena una `Response` HTTP en la caché (crea la caché si no existe). | `Promise<void>` |
| `putJson<T>(cacheName, request, data, init?)` | Serializa `data` a JSON y lo guarda como `Response` (crea la caché si no existe). | `Promise<void>` |
| `match(cacheName, request, options?)` | Busca una `Response` almacenada en caché sin crear la caché si no existe. | `Promise<Response \| undefined>` |
| `matchJson<T>(cacheName, request, options?)` | Busca un recurso en caché y deserializa su cuerpo JSON sin crear la caché. | `Promise<T \| null>` |
| `listEntries(cacheName)` | Lista las URLs almacenadas dentro de una caché sin crearla si no existe. | `Promise<string[]>` (`[]` si no existe) |
| `deleteEntry(cacheName, request, options?)` | Elimina un recurso específico de la caché sin crearla si no existe. | `Promise<boolean>` (`false` si no existe) |
| `deleteCache(cacheName)` | Elimina por completo una caché y todo su contenido. | `Promise<boolean>` |
| `clearAllCaches()` | Elimina todas las cachés registradas en `Cache Storage`. | `Promise<number>` (cantidad eliminada) |

> **Notas importantes sobre `CacheStorageService`:**
> - Cuando el recurso o la caché no existen, `match` devuelve `undefined` y `matchJson` devuelve `null`.
> - Las operaciones de lectura (`match`, `matchJson`, `listEntries`) y `deleteEntry` **no crean** cachés inexistentes.
> - Únicamente `openCache`, `put` y `putJson` crean la caché si aún no existe.
> - La API nativa `Cache Storage` de los navegadores solo está disponible en contextos seguros (**HTTPS** o `localhost`).

---

## Ejemplos de uso

### 1. `LocalStorageService`

```typescript
import { Component, inject } from '@angular/core';
import { LocalStorageService, StorageError } from '@sebasmf/uceva-storage-manager';

interface Usuario {
  id: number;
  nombre: string;
  activo: boolean;
}

@Component({
  selector: 'app-ejemplo-local',
  template: '',
})
export class EjemploLocalComponent {
  private readonly local = inject(LocalStorageService);

  probarLocalStorage(): void {
    // Almacenar valores primitivos y objetos
    this.local.set('tema', 'oscuro');
    this.local.set<Usuario>('usuario', { id: 1, nombre: 'Ana', activo: true }, { prefix: 'auth' });

    // Consultar valores (retorna null si no existe)
    const tema = this.local.get<string>('tema');
    const idioma = this.local.getOrDefault<string>('idioma', 'es');

    // Verificar existencia antes de distinguir null literal de inexistencia
    if (this.local.has('usuario', { prefix: 'auth' })) {
      // Actualizar un valor existente
      this.local.update<Usuario>(
        'usuario',
        (actual) => ({ ...actual, activo: false }),
        { prefix: 'auth' },
      );
    }

    // Listar claves y tamaño por prefijo
    const clavesAuth = this.local.keys('auth'); // ['usuario']
    const totalAuth = this.local.size('auth'); // 1

    // Eliminar una clave o limpiar un prefijo
    this.local.remove('tema');
    this.local.clear('auth');
  }

  manejarErrores(): void {
    try {
      this.local.update<number>('no-existe', (n) => n + 1);
    } catch (error) {
      if (error instanceof StorageError) {
        console.error(`Error [${error.code}]: ${error.message}`);
      }
    }
  }
}
```

### 2. `CacheStorageService`

```typescript
import { Component, inject } from '@angular/core';
import { CacheStorageService, StorageError } from '@sebasmf/uceva-storage-manager';

interface Curso {
  codigo: string;
  nombre: string;
}

@Component({
  selector: 'app-ejemplo-cache',
  template: '',
})
export class EjemploCacheComponent {
  private readonly cache = inject(CacheStorageService);

  async probarCacheStorage(): Promise<void> {
    const nombreCache = 'uceva-api-v1';

    // Abrir o verificar una caché explícitamente
    await this.cache.openCache(nombreCache);
    const existe = await this.cache.hasCache(nombreCache);

    if (existe) {
      // Guardar un objeto JSON como Response HTTP
      await this.cache.putJson<Curso>(nombreCache, '/api/cursos/101', {
        codigo: 'ARQ-801',
        nombre: 'Arquitectura de Software',
      });

      // Consultar el objeto JSON (no crea la caché si no existe)
      const curso = await this.cache.matchJson<Curso>(nombreCache, '/api/cursos/101');

      // Almacenar y consultar una Response HTTP personalizada
      await this.cache.put(nombreCache, '/api/saludo', new Response('Hola UCEVA'));
      const respuesta = await this.cache.match(nombreCache, '/api/saludo');
      const texto = await respuesta?.text();

      // Listar entradas y cachés registradas
      const entradas = await this.cache.listEntries(nombreCache);
      const caches = await this.cache.listCaches();

      // Eliminar una entrada, una caché completa o todas las cachés
      await this.cache.deleteEntry(nombreCache, '/api/saludo');
      await this.cache.deleteCache(nombreCache);
      await this.cache.clearAllCaches();
    }
  }
}
```

---

## Manejo de errores

Todos los errores controlados lanzan una instancia de `StorageError` con una propiedad `code` perteneciente a `StorageErrorCode`:

| Código (`StorageErrorCode`) | Cuándo ocurre |
| :--- | :--- |
| `STORAGE_UNAVAILABLE` | `localStorage` o `caches` no existen, están bloqueados por el navegador o falla el acceso genérico al escribir. |
| `INVALID_KEY` | La clave pasada a `LocalStorageService` no es una cadena o está vacía/en blanco. |
| `SERIALIZATION_ERROR` | Se intenta guardar `undefined` o un valor con referencias circulares no serializable a JSON. |
| `DESERIALIZATION_ERROR` | El contenido almacenado en `LocalStorage` o en el cuerpo de una `Response` en caché no es JSON válido. |
| `QUOTA_EXCEEDED` | Se excede la cuota de almacenamiento de `LocalStorage` al ejecutar `setItem`. |
| `KEY_NOT_FOUND` | Se llama a `update` sobre una clave que no existe o cuyo valor almacenado es `null`. |
| `INVALID_CACHE_NAME` | El nombre de caché pasado a `CacheStorageService` no es una cadena o está vacío/en blanco. |
| `INVALID_REQUEST` | La solicitud o URL (`request`) pasada a `CacheStorageService` es nula, indefinida o una cadena vacía. |
| `CACHE_OPERATION_ERROR` | La `Response` pasada a `put` es inválida o una operación nativa de `CacheStorage`/`Cache` rechaza inesperadamente. |

```typescript
import { CacheStorageService, StorageError } from '@sebasmf/uceva-storage-manager';

async function consultarSeguro(cache: CacheStorageService): Promise<void> {
  try {
    await cache.openCache('');
  } catch (error) {
    if (error instanceof StorageError) {
      switch (error.code) {
        case 'INVALID_CACHE_NAME':
          console.warn('Nombre de caché inválido:', error.message);
          break;
        case 'STORAGE_UNAVAILABLE':
          console.error('El almacenamiento no está disponible en este contexto.');
          break;
        default:
          console.error(`Error inesperado [${error.code}]:`, error.cause);
      }
    }
  }
}
```

---

## Desarrollo

```bash
npm ci
npm run test:coverage
npm run build:lib
npm run compodoc
```

---

## Licencia

MIT © 2026 Juan Estevan Santiago.
