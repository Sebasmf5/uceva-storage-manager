# UCEVA Storage Manager

![Angular](https://img.shields.io/badge/Angular-20.3-dd0031?style=flat-square&logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?style=flat-square&logo=typescript)
![Coverage](https://img.shields.io/badge/Coverage-100%25-2ea44f?style=flat-square&logo=jest)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

Workspace Angular del proyecto **UCEVA Storage Manager**, que contiene la librería reutilizable `@sebasmf/uceva-storage-manager` para la gestión tipada de `LocalStorage` y `Cache Storage` en aplicaciones web Angular.

---

## Integrantes

- Nombre completo del integrante 1
- Nombre completo del integrante 2
- Nombre completo del integrante 3

---

## Enlaces

- **Paquete NPM:** https://www.npmjs.com/package/@sebasmf/uceva-storage-manager
- **Repositorio:** https://github.com/Sebasmf5/uceva-storage-manager
- **Showcase:** https://sebasmf5.github.io/uceva-storage-manager/showcase/
- **Documentación:** https://sebasmf5.github.io/uceva-storage-manager/docs/

---

## Estructura del repositorio

```text
uceva-storage-manager/
├── .github/
│   └── workflows/
│       ├── ci.yml                       # Integración continua (pruebas 100%, build y Compodoc)
│       └── publish.yml                  # Publicación en NPM y despliegue en GitHub Pages
├── projects/
│   └── uceva-storage-manager/           # Código fuente de la librería Angular
│       ├── src/
│       │   ├── lib/
│       │   │   ├── errors/              # StorageError y StorageErrorCode
│       │   │   ├── interfaces/          # ILocalStorageService e ICacheStorageService
│       │   │   ├── internal/            # Utilidades internas (@internal, no exportadas)
│       │   │   ├── models/              # LocalStorageOptions
│       │   │   └── services/            # LocalStorageService y CacheStorageService (+ specs)
│       │   ├── public-api.ts            # Única superficie pública de la librería
│       │   └── public-api.spec.ts       # Prueba de verificación de la superficie pública
│       ├── CHANGELOG.md                 # Historial de versiones de la librería
│       ├── ng-package.json
│       ├── package.json                 # Manifiesto NPM de distribución
│       └── README.md                    # Documentación publicada en NPM
├── scripts/                             # Scripts auxiliares de automatización
├── showcase/                            # Aplicación Angular independiente que consume la librería desde NPM
├── jest.config.mjs                      # Configuración de Jest con umbral de cobertura al 100%
├── setup-jest.ts                        # Inicialización de entorno Angular para Jest
├── LICENSE                              # Licencia MIT
└── package.json                         # Scripts de compilación, pruebas y Compodoc
```

---

## Instalación y uso rápido

Consulta la documentación detallada de instalación, API pública, manejo de errores y ejemplos de código en [`projects/uceva-storage-manager/README.md`](./projects/uceva-storage-manager/README.md).

```bash
npm install @sebasmf/uceva-storage-manager
```

---

## Comandos de desarrollo

```bash
npm ci
npm run test:coverage
npm run build:lib
npm run compodoc
```

- `npm run test:coverage`: ejecuta Jest verificando el **100%** de cobertura en *statements*, *branches*, *functions* y *lines*.
- `npm run build:lib`: compila la librería en modo producción en `dist/uceva-storage-manager/`.
- `npm run compodoc`: genera la documentación técnica en `docs/compodoc/` excluyendo elementos `@internal` y miembros privados.

---

## Flujo de trabajo

- **Ramas:**
  - `main`: rama estable de producción.
  - `develop`: rama de integración.
  - `feature/*`, `docs/*`, `refactor/*`: ramas de trabajo para nuevas funcionalidades, documentación y refactorizaciones.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) en español (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **Pull Requests:** todo cambio en `feature/*`, `docs/*` o `refactor/*` se integra mediante PR hacia `develop`, y posteriormente mediante PR de `develop` hacia `main`.

---

## Publicar una versión

1. Incrementa la versión en `projects/uceva-storage-manager/package.json` (por ejemplo, `1.0.1`).
2. Realiza el commit de liberación:
   ```bash
   git commit -am "chore(release): 1.0.1"
   ```
3. Crea la etiqueta anotada coincidente con la versión (`vX.Y.Z`) y súbela al remoto:
   ```bash
   git tag -a v1.0.1 -m "Release v1.0.1"
   git push origin v1.0.1
   ```
4. El workflow **Publish** (`.github/workflows/publish.yml`) compilará la librería, la publicará en NPM y desplegará el Showcase y la documentación de Compodoc en GitHub Pages.

---

## Licencia

MIT © 2026 Juan Estevan Santiago.
