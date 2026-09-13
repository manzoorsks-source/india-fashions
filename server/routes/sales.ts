import { Router, Response } from 'express';
import { query, queryOne, run } from '../db/database.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';
import { broadcastEvent } from './events.js';
import { SaleCampaign } from '../../shared/types.js';

const router = Router();

// Public: Get currently active campaigns
router.get('/active', (req: AuthenticatedRequest, res: Response) => {
  const now = new Date().toISOString();
  const campaigns = query<SaleCampaign>(
    'SELECT * FROM sale_campaigns WHERE is_active = 1 AND start_at <= ? AND end_at >= ? ORDER BY discount_percentage DESC, start_at DESC',
    [now, now]
  );
  res.json({ campaigns });
});

// Admin: Get all campaigns
router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const campaigns = query<SaleCampaign>('SELECT * FROM sale_campaigns ORDER BY start_at DESC');
  res.json({ campaigns });
});

// Admin: Create campaign
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { name, label, description, discount_percentage, start_at, end_at, is_active, show_countdown, apply_to, target_id } = req.body;

  if (!name || !label || !start_at || !end_at) {
    return res.status(400).json({ error: 'Name, label, start date, and end date are required' });
  }

  if (new Date(end_at) <= new Date(start_at)) {
    return res.status(400).json({ error: 'To Date (End Date) must be after From Date (Start Date)' });
  }

  const id = 'camp-' + Date.now().toString(36);
  run(`INSERT INTO sale_campaigns (
    id, name, label, description, discount_percentage, start_at, end_at, is_active, show_countdown, apply_to, target_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
    id, name, label, description || '', parseFloat(discount_percentage) || 0,
    start_at, end_at, is_active !== false && is_active !== 0 ? 1 : 0, show_countdown ? 1 : 0, apply_to || 'ALL', target_id || null
  ]);

  recordAudit(req, 'SALE_CAMPAIGN', id, 'CREATE_CAMPAIGN', null, req.body);
  broadcastEvent('campaign_updated', { id, name });

  res.status(201).json({ success: true, id });
});

// Admin: Update campaign
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const prev = queryOne<SaleCampaign>('SELECT * FROM sale_campaigns WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Campaign not found' });

  const { name, label, description, discount_percentage, start_at, end_at, is_active, show_countdown, apply_to, target_id } = req.body;

  if (start_at && end_at && new Date(end_at) <= new Date(start_at)) {
    return res.status(400).json({ error: 'To Date (End Date) must be after From Date (Start Date)' });
  }

  run(`UPDATE sale_campaigns SET
    name = ?, label = ?, description = ?, discount_percentage = ?, start_at = ?, end_at = ?,
    is_active = ?, show_countdown = ?, apply_to = ?, target_id = ?
    WHERE id = ?`, [
    name, label, description, parseFloat(discount_percentage) || 0,
    start_at, end_at, is_active ? 1 : 0, show_countdown ? 1 : 0, apply_to || 'ALL', target_id || null, id
  ]);

  recordAudit(req, 'SALE_CAMPAIGN', id, 'UPDATE_CAMPAIGN', prev, req.body);
  broadcastEvent('campaign_updated', { id, name });

  res.json({ success: true });
});

// Admin: Toggle campaign active/disabled status
router.patch('/:id/toggle', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const prev = queryOne<SaleCampaign>('SELECT * FROM sale_campaigns WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Campaign not found' });

  const newActive = prev.is_active ? 0 : 1;
  run('UPDATE sale_campaigns SET is_active = ? WHERE id = ?', [newActive, id]);

  recordAudit(req, 'SALE_CAMPAIGN', id, 'TOGGLE_CAMPAIGN_STATUS', { is_active: prev.is_active }, { is_active: newActive });
  broadcastEvent('campaign_updated', { id, name: prev.name, is_active: Boolean(newActive) });

  res.json({ success: true, is_active: Boolean(newActive) });
});

// Admin: Delete campaign
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const prev = queryOne<SaleCampaign>('SELECT * FROM sale_campaigns WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Campaign not found' });

  run('DELETE FROM sale_campaigns WHERE id = ?', [id]);

  recordAudit(req, 'SALE_CAMPAIGN', id, 'DELETE_CAMPAIGN', prev, null);
  broadcastEvent('campaign_updated', { id, name: prev.name, deleted: true });

  res.json({ success: true });
});

export default router;
