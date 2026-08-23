require('dotenv').config();
const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { helmetMiddleware, permissionsPolicy } = require('./middleware/security');
const productsRouter = require('./routes/products');
const adminRouter = require('./routes/admin');
const siteContentRouter = require('./routes/siteContent');
const { UPLOADS_DIR, testimonials: testimonialsUpload } = require('./upload');

const app = express();

app.use(helmetMiddleware);
app.use(permissionsPolicy);
app.use(cookieParser());

app.use('/api/products', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/site-content', siteContentRouter);

/* servido aparte de express.static(public): así UPLOADS_DIR puede apuntar
   a un volumen persistente fuera de public/ sin perder las imágenes */
app.use('/assets/images/products', express.static(UPLOADS_DIR));
app.use('/assets/images/testimonials', express.static(testimonialsUpload.UPLOADS_DIR));
app.use(express.static(path.join(__dirname, '..', 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Agua de Mar corriendo en http://localhost:${PORT}`);
});
