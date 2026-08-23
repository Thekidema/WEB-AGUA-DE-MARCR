const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function fileFilter(req, file, cb) {
  if (!EXT_BY_MIME[file.mimetype]) {
    return cb(new Error('Formato de imagen no soportado. Usa JPEG, PNG o WebP.'));
  }
  cb(null, true);
}

/* fábrica: cada sección (productos, testimonios) tiene su propio directorio
   de subida, configurable por env var independiente (para poder apuntar
   cada una a una ruta distinta dentro de un futuro volumen persistente) */
function createUploader(dir) {
  fs.mkdirSync(dir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dir),
    filename: (req, file, cb) => cb(null, crypto.randomUUID() + EXT_BY_MIME[file.mimetype]),
  });

  const upload = multer({ storage, fileFilter, limits: { fileSize: 8 * 1024 * 1024 } });

  function deleteUploadedImage(filename) {
    if (!filename) return;
    fs.unlink(path.join(dir, filename), (err) => {
      if (err && err.code !== 'ENOENT') console.error('No se pudo borrar imagen', filename, err);
    });
  }

  return { upload, deleteUploadedImage, UPLOADS_DIR: dir };
}

const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.cwd(), process.env.UPLOADS_DIR)
  : path.join(__dirname, '..', 'public', 'assets', 'images', 'products');

const TESTIMONIALS_DIR = process.env.TESTIMONIALS_DIR
  ? path.resolve(process.cwd(), process.env.TESTIMONIALS_DIR)
  : path.join(__dirname, '..', 'public', 'assets', 'images', 'testimonials');

module.exports = {
  ...createUploader(UPLOADS_DIR),
  testimonials: createUploader(TESTIMONIALS_DIR),
};
