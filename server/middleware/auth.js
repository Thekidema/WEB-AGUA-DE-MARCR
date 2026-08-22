const jwt = require('jsonwebtoken');

const COOKIE_NAME = 'admin_token';
const TOKEN_TTL = '12h';

function signAdminToken(username) {
  return jwt.sign({ sub: username }, process.env.JWT_SECRET, { expiresIn: TOKEN_TTL });
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 12 * 60 * 60 * 1000,
    path: '/',
  };
}

function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: 'No autenticado' });
  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' });
  }
}

module.exports = { COOKIE_NAME, signAdminToken, cookieOptions, requireAdmin };
