import { Router, Response } from 'express';
import { query, queryOne, run } from '../db/database.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';
import { broadcastEvent } from './events.js';
import { TickerMessage } from '../../shared/types.js';

const router = Router();

// Public: Get currently published, non-expired ticker messages
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const now = new Date().toISOString();
  const messages = query<TickerMessage>(
    `SELECT id, content, link_url, publish_at, expire_at, is_active, sort_order 
     FROM ticker_messages 
     WHERE is_active = 1 AND publish_at <= ? AND expire_at >= ? 
     ORDER BY sort_order ASC`,
    [now, now]
  );
  res.json({ messages });
});

// Admin: Get all ticker messages
router.get('/admin', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const messages = query<TickerMessage>('SELECT * FROM ticker_messages ORDER BY sort_order ASC');
  res.json({ messages });
});

// Admin: Create ticker message
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { content, link_url, publish_at, expire_at, is_active, sort_order } = req.body;
  if (!content) return res.status(400).json({ error: 'Content is required' });

  const id = 'tick-' + Date.now().toString(36);
  const now = new Date().toISOString();
  const pub = publish_at || now;
  const exp = expire_at || new Date(Date.now() + 30 * 86400000).toISOString();

  run(
    `INSERT INTO ticker_messages (id, content, link_url, publish_at, expire_at, is_active, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, content, link_url || '', pub, exp, is_active !== false ? 1 : 0, sort_order || 0]
  );

  recordAudit(req, 'TICKER', id, 'CREATE_TICKER', null, { content, link_url, publish_at: pub, expire_at: exp });
  broadcastEvent('ticker_updated', { id, content });

  res.status(201).json({ success: true, id });
});

// Admin: Update ticker message
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { content, link_url, publish_at, expire_at, is_active, sort_order } = req.body;

  const prev = queryOne('SELECT * FROM ticker_messages WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Ticker message not found' });

  run(
    `UPDATE ticker_messages 
     SET content = ?, link_url = ?, publish_at = ?, expire_at = ?, is_active = ?, sort_order = ?
     WHERE id = ?`,
    [content, link_url, publish_at, expire_at, is_active ? 1 : 0, sort_order, id]
  );

  recordAudit(req, 'TICKER', id, 'UPDATE_TICKER', prev, req.body);
  broadcastEvent('ticker_updated', { id, content });

  res.json({ success: true });
});

// Admin: Delete ticker message
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const prev = queryOne('SELECT * FROM ticker_messages WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Ticker message not found' });

  run('DELETE FROM ticker_messages WHERE id = ?', [id]);
  recordAudit(req, 'TICKER', id, 'DELETE_TICKER', prev, null);
  broadcastEvent('ticker_updated', { id, deleted: true });

  res.json({ success: true });
});

export default router;
