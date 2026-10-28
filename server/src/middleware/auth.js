import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const DEV_SECRET = 'dev-only-change-me';
const secret = () => process.env.JWT_SECRET || DEV_SECRET;

if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET not set – using an insecure development secret.');
}

/** Constant-time string comparison (avoids timing attacks on the admin password). */
export function safeEqual(a, b) {
  const ba = Buffer.from(String(a ?? ''));
  const bb = Buffer.from(String(b ?? ''));
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

export function signToken(payload) {
  return jwt.sign(payload, secret(), { expiresIn: '8h' });
}

/** Require a valid Bearer token; attaches req.user = { role, visitorId?, name }. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Please sign in' });
  try {
    req.user = jwt.verify(token, secret());
    next();
  } catch {
    res.status(401).json({ error: 'Session expired – please sign in again' });
  }
}

export const requireRole = role => (req, res, next) =>
  req.user?.role === role ? next() : res.status(403).json({ error: 'You do not have access to this resource' });

export const requireAdmin = [requireAuth, requireRole('admin')];
export const requireUser  = [requireAuth, requireRole('user')];
