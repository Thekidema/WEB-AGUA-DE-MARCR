require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { helmetMiddleware, permissionsPolicy } = require('./middleware/security');
const { initDb } = require('./db');
const productsRouter = require('./routes/products');
const adminRouter = require('./routes/admin');
const siteContentRouter = require('./routes/siteContent');
const ordersRouter = require('./routes/orders');
const { UPLOADS_DIR } = require('./upload');

const app = express();

/* Railway pone la app detrás de un solo proxy interno — sin esto, Express
   ve la IP del proxy (la misma para todos los visitantes) en vez de la IP
   real, y el rate limiting de /login y /orders deja de funcionar por
   visitante (se comparte entre todo el sitio, o peor: un atacante puede
   agotar el cupo de intentos de login y bloquear al admin real). */
app.set('trust proxy', 1);

app.use(helmetMiddleware);
app.use(permissionsPolicy);
app.use(cookieParser());

app.use('/api/products', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/site-content', siteContentRouter);
app.use('/api/orders', ordersRouter);

/* servido aparte de express.static(public): así UPLOADS_DIR puede apuntar
   a un volumen persistente fuera de public/ sin perder las imágenes */
app.use('/assets/images/products', express.static(UPLOADS_DIR));
app.use(express.static(path.join(__dirname, '..', 'public')));

/* handler de error global — atrapa cualquier excepción que llegue vía
   next(err) desde asyncHandler(). Nunca expone stack traces ni mensajes
   internos de la base de datos al cliente; sin esto, un error no
   capturado en una ruta async tira el proceso entero para todo el sitio. */
app.use((err, req, res, next) => {
  console.error('[error]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'Ocurrió un error inesperado. Intentá de nuevo en unos segundos.' });
});

const PORT = process.env.PORT || 3000;
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Agua de Mar corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });
