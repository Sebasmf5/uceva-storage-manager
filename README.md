# UCEVA Storage Manager

Workspace Angular del proyecto **UCEVA Storage Manager**, que contiene la librería reutilizable `@sebasmf/uceva-storage-manager` para la gestión tipada de `LocalStorage` y `Cache Storage` en aplicaciones web Angular.

---

## Estructura del repositorio

```text
uceva-storage-manager/
├── projects/
│   └── uceva-storage-manager/       # Código fuente de la librería Angular
│       ├── src/
│       │   ├── lib/
│       │   │   ├── core/            # Utilidades internas (ocultas de public-api y Compodoc)
│       │   │   ├── models/          # Modelos, interfaces y StorageError
│       │   │   └── services/        # LocalStorageService y CacheStorageService (+ specs)
│       │   └── public-api.ts        # Superficie pública de la librería
│       ├── ng-package.json
│       ├── package.json             # Manifiesto NPM de distribución
│       └── README.md                # Documentación publicada en NPM
├── jest.config.mjs                  # Configuración de Jest con umbral de cobertura al 100%
├── setup-jest.ts                    # Inicialización de entorno Angular para Jest
├── LICENSE                          # Licencia MIT
└── package.json                     # Scripts de compilación, pruebas y Compodoc
```

---

## Instalación y uso rápido

Consulta la documentación detallada de instalación, API pública y ejemplos de código en [`projects/uceva-storage-manager/README.md`](./projects/uceva-storage-manager/README.md).

```bash
npm install @sebasmf/uceva-storage-manager
```

---

## Comandos de desarrollo

### Instalar dependencias

```bash
npm install
```

### Ejecutar pruebas unitarias y cobertura (100% requerido)

```bash
npm test
npm run test:coverage
```

### Compilar la librería en modo producción

```bash
npm run build:lib
```

Los artefactos compilados se generan en `dist/uceva-storage-manager/`.

### Generar documentación técnica con Compodoc

```bash
npm run compodoc
npm run compodoc:serve
```

La documentación se genera en `docs/compodoc/` excluyendo elementos `@internal` y miembros privados.

---

## Flujo de trabajo y estándares

- **Ramas:** `main` (producción), `develop` (integración) y `feature/*` para cada funcionalidad.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) en español (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **Cobertura mínima:** 100% en *statements*, *branches*, *functions* y *lines*.

---

## Licencia

MIT © 2026 Juan Estevan Santiago.
