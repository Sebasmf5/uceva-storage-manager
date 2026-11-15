# UCEVA Storage Manager (`@sebasmf/uceva-storage-manager`)

Librería reutilizable para **Angular** orientada a facilitar la gestión del almacenamiento en aplicaciones web mediante **LocalStorage** y **Cache Storage**, con una API tipada, serialización JSON automática y manejo estandarizado de errores.

---

## Características principales

- **API tipada y consistente:** abstracción completa sobre `window.localStorage` y `window.caches`.
- **Serialización JSON automática:** soporte transparente para primitivos, arreglos y objetos en `LocalStorageService`, además de respuestas HTTP y cargas JSON en `CacheStorageService`.
- **Espacios de nombres por prefijo:** aislamiento de claves en `LocalStorage` mediante `options.prefix`.
- **Manejo controlado de errores:** emisión de `StorageError` con códigos específicos (`STORAGE_UNAVAILABLE`, `INVALID_KEY`, `SERIALIZATION_ERROR`, `DESERIALIZATION_ERROR`, `QUOTA_EXCEEDED`, `KEY_NOT_FOUND`, `INVALID_CACHE_NAME`, `INVALID_REQUEST`, `CACHE_OPERATION_ERROR`).
- **Encapsulamiento estricto:** `public-api.ts` expone únicamente servicios, modelos e interfaces públicas.
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
  StorageError,
} from '@sebasmf/uceva-storage-manager';
```

---

## API Pública expuesta

| Elemento | Tipo | Descripción |
| :--- | :--- | :--- |
| `LocalStorageService` | Servicio | Gestión CRUD, actualización, prefijos y consulta en `LocalStorage`. |
| `CacheStorageService` | Servicio | Administración de cachés, respuestas HTTP y recursos JSON en `Cache Storage`. |
| `StorageError` | Clase | Error tipado con propiedad `code: StorageErrorCode` y `cause`. |
| `LocalStorageOptions` | Interfaz | Opciones por operación (`{ prefix?: string }`). |
| `StorageErrorCode` | Tipo | Unión de códigos de error estandarizados. |

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

    // Guardar un objeto JSON como Response HTTP (crea la caché si no existe)
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

    // Listar entradas de una caché y cachés registradas
    const entradas = await this.cache.listEntries(nombreCache);
    const caches = await this.cache.listCaches();

    // Eliminar un recurso específico o eliminar toda la caché
    await this.cache.deleteEntry(nombreCache, '/api/saludo');
    await this.cache.deleteCache(nombreCache);
  }
}
```

---

## Licencia

MIT © 2026 Juan Estevan Santiago.
