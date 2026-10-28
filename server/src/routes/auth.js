import { Router } from 'express';
import { loadSnapshot } from '../db/store.js';
import { signToken, safeEqual, requireAuth } from '../middleware/auth.js';

const router = Router();

/**
 * POST /api/auth/login
 *  - Visitor: { role: 'user',  idNumber: 'ID1001', lastName: 'Kumar' }
 *    (the schema has no password column, so ID_Number + Last_Name is the credential)
 *  - Admin:   { role: 'admin', username, password }  (checked against .env)
 */
router.post('/login', async (req, res, next) => {
  try {
    const { role } = req.body || {};

    if (role === 'admin') {
      const { username, password } = req.body;
      const okUser = safeEqual(username, process.env.ADMIN_USERNAME || 'admin');
      const okPass = safeEqual(password, process.env.ADMIN_PASSWORD || 'admin123');
      if (!okUser || !okPass) return res.status(401).json({ error: 'Invalid admin username or password' });
      const user = { role: 'admin', name: 'Administrator', username };
      return res.json({ token: signToken(user), user });
    }

    if (role === 'user') {
      const idNumber = String(req.body.idNumber || '').trim().toUpperCase();
      const lastName = String(req.body.lastName || '').trim().toLowerCase();
      if (!idNumber || !lastName) return res.status(400).json({ error: 'ID number and last name are required' });

      const db = await loadSnapshot();
      const v = db.visitors.find(x => String(x.ID_NUMBER).toUpperCase() === idNumber);
      if (!v || String(v.LAST_NAME).toLowerCase() !== lastName) {
        return res.status(401).json({ error: 'ID number and last name do not match our records' });
      }
      const user = {
        role: 'user',
        visitorId: v.VISITOR_ID,
        name: `${v.FIRST_NAME} ${v.LAST_NAME}`,
        idNumber: v.ID_NUMBER,
        department: v.DEPARTMENT,
        visitorType: v.VISITOR_TYPE,
      };
      return res.json({ token: signToken(user), user });
    }

    res.status(400).json({ error: "role must be 'user' or 'admin'" });
  } catch (err) { next(err); }
});

router.get('/me', requireAuth, (req, res) => {
  const { iat, exp, ...user } = req.user;
  res.json({ user });
});

export default router;
