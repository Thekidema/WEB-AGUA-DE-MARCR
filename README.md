# Agua de Mar · Beachwear Costa Rica

Sitio web con panel de administrador para la marca de trajes de baño hechos a mano en Costa Rica. Backend Node.js + Express + SQLite (local en dev, [Turso](https://turso.tech) gestionado en la nube en producción); el sitio público y el panel admin son HTML/JS vanilla (sin build step).

## Estructura del proyecto

```
.
├── package.json
├── .env.example                # copiar a .env y completar
├── data/                        # aguademar.sqlite (gitignored)
├── server/
│   ├── index.js                 # Express: helmet, static, rutas, listen
│   ├── db.js                    # @libsql/client: archivo local (dev) o Turso (prod)
│   ├── upload.js                # multer + S3 client: subida de imágenes a Cloudflare R2
│   ├── productSerializer.js
│   ├── middleware/
│   │   ├── auth.js              # JWT en cookie httpOnly
│   │   └── security.js          # helmet + CSP + Permissions-Policy
│   ├── routes/
│   │   ├── products.js          # GET /api/products (pública)
│   │   └── admin.js             # login/logout/session + CRUD productos
│   └── scripts/
│       └── create-admin.js      # genera el hash de la contraseña admin
└── public/                      # raíz estática servida por Express
    ├── index.html
    ├── js/{app.js, data.js}
    ├── assets/...
    └── admin/                   # panel de administrador
        ├── login.html
        ├── dashboard.html
        └── js/{admin-common.js, login.js, dashboard.js}
```

## Desarrollo local

```bash
npm install
cp .env.example .env
# generar JWT_SECRET:
openssl rand -hex 32
# generar ADMIN_PASSWORD_HASH (pide usuario y contraseña por CLI):
npm run create-admin
# pegar los valores generados en .env

npm run dev
```

Sitio público: http://localhost:3000
Panel admin: http://localhost:3000/admin/login.html

## Notas

- El catálogo se administra 100% desde el panel — no hay productos de ejemplo, la base arranca vacía.
- Las imágenes de producto subidas desde el panel se guardan en Cloudflare R2 (bucket `aguademar-productos`, requiere `R2_*` en `.env`) — nunca en disco local, así sobreviven a los redeploys de Railway (que no persisten disco). `server/upload.js` sube directo desde memoria vía `@aws-sdk/client-s3`.
- CSP y demás headers de seguridad se configuran en `server/middleware/security.js` (antes vivían en `_headers` de Netlify y en un `<meta>` de `index.html`; ambos se eliminaron al migrar a un servidor Node real).
- Base de datos: sin `TURSO_DATABASE_URL`/`TURSO_AUTH_TOKEN` seteados, usa un archivo SQLite local (`DB_PATH`) — así funciona `npm run dev` sin depender de la nube. En producción (Railway) esas dos variables apuntan a la base gestionada en Turso, con backups y persistencia real.
- Producción (Railway): sin volumen persistente — ni la base de datos (Turso) ni las imágenes (R2) dependen de disco local, así que un redeploy nunca pierde datos.

## Licencia

Proyecto privado de Agua de Mar Beachwear CR.
