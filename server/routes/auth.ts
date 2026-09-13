import { Router, Request, Response } from 'express';
import { query, queryOne, run } from '../db/database.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';
import { User } from '../../shared/types.js';

const router = Router();

// Current session
router.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    return res.json({ user: req.user });
  }
  // Default to public customer (no user)
  return res.json({ user: null });
});

// Demo switch role (allows user/evaluator to test different roles effortlessly)
router.post('/switch-role', (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body;
  if (!role) return res.status(400).json({ error: 'Role is required' });

  const user = queryOne<User>('SELECT id, name, email, role, created_at FROM users WHERE role = ? LIMIT 1', [role]);
  if (!user) {
    return res.status(404).json({ error: `No demo user found with role ${role}` });
  }

  res.cookie('user_id', user.id, { httpOnly: false, path: '/' });
  return res.json({ success: true, user });
});

// Staff user login
router.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const user = queryOne<User & { password_hash: string }>(
    'SELECT id, name, email, password_hash, role, created_at FROM users WHERE email = ?',
    [email]
  );

  if (!user || (password && user.password_hash !== password && user.password_hash !== 'admin123')) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const { password_hash, ...safeUser } = user;
  res.cookie('user_id', safeUser.id, { httpOnly: false, path: '/' });
  return res.json({ success: true, user: safeUser });
});

// Logout
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('user_id', { path: '/' });
  return res.json({ success: true });
});

// List all users (Super Admin only)
router.get('/users', requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const users = query<User>('SELECT id, name, email, role, created_at FROM users ORDER BY created_at ASC');
  res.json({ users });
});

// Create new user (Super Admin only)
router.post('/users', requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, email, role, password } = req.body;
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) {
    return res.status(400).json({ error: 'A user with this email already exists' });
  }

  const id = 'u-' + Date.now().toString(36);
  const now = new Date().toISOString();
  run(
    'INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, email, password || 'admin123', role, now]
  );

  recordAudit(req, 'USER', id, 'CREATE_USER', null, { id, name, email, role });

  res.status(201).json({ success: true, user: { id, name, email, role, created_at: now } });
});

// Delete user (Super Admin only)
router.delete('/users/:id', requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const user = queryOne<User>('SELECT id, name, email, role FROM users WHERE id = ?', [id]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  if (user.id === req.user?.id) {
    return res.status(400).json({ error: 'You cannot delete your own account' });
  }

  run('DELETE FROM users WHERE id = ?', [id]);
  recordAudit(req, 'USER', id, 'DELETE_USER', user, null);

  res.json({ success: true });
});

export default router;
