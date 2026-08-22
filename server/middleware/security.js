const helmet = require('helmet');

const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", 'https://cdn.jsdelivr.net/npm/lucide@0.511.0/'],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://formspree.io'],
      formAction: ['https://formspree.io'],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
    },
  },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
});

/* helmet no cubre bien Permissions-Policy (directiva nueva); replica el valor de _headers */
function permissionsPolicy(req, res, next) {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), interest-cohort=()'
  );
  next();
}

module.exports = { helmetMiddleware, permissionsPolicy };
