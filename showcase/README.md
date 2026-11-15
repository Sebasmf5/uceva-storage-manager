# Showcase – @sebasmf/uceva-storage-manager

Aplicación Angular independiente que demuestra la API pública de la librería, consumida
directamente desde NPM (`npm install @sebasmf/uceva-storage-manager`).

```bash
npm ci
npx ng serve   # http://localhost:4200
npx ng build --configuration production --base-href /uceva-storage-manager/showcase/
```

La salida de producción queda en `dist/showcase/browser/` (la usa `publish.yml` para GitHub Pages).
Cache Storage requiere HTTPS o `localhost`.
