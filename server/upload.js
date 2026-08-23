const crypto = require('crypto');
const multer = require('multer');
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

const BUCKET = process.env.R2_BUCKET_NAME;

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

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

const multerUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 },
});

/* multer deja el archivo en memoria (req.file.buffer); acá lo subimos a R2
   y dejamos req.file.filename con la key generada, para que el resto del
   código (admin.js) siga viendo la misma forma de req.file que tenía con
   el disco local — no necesita saber que la imagen ahora vive en R2. */
const upload = {
  single(fieldName) {
    const middleware = multerUpload.single(fieldName);
    return (req, res, next) => {
      middleware(req, res, async (err) => {
        if (err) return next(err);
        if (!req.file) return next();
        try {
          const key = crypto.randomUUID() + EXT_BY_MIME[req.file.mimetype];
          await s3.send(new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
          }));
          req.file.filename = key;
          next();
        } catch (uploadErr) {
          console.error('Error subiendo imagen a R2', uploadErr);
          next(new Error('No se pudo subir la imagen. Intentá de nuevo en unos segundos.'));
        }
      });
    };
  },
};

async function deleteUploadedImage(filename) {
  if (!filename) return;
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: filename }));
  } catch (err) {
    console.error('No se pudo borrar imagen de R2', filename, err);
  }
}

module.exports = { upload, deleteUploadedImage };
