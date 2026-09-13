import { Router, Response } from 'express';
import { query, queryOne, run } from '../db/database.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';
import { broadcastEvent } from './events.js';
import { StoreSettings, AuditLog } from '../../shared/types.js';

const router = Router();

// Public: Get store settings
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const rows = query<{ key: string; value: string }>('SELECT key, value FROM store_settings');
  const settings: any = {};
  for (const row of rows) {
    if (['shop_latitude', 'shop_longitude', 'delivery_radius_km', 'delivery_base_charge', 'free_delivery_threshold'].includes(row.key)) {
      settings[row.key] = parseFloat(row.value) || 0;
    } else if (['cod_enabled', 'upi_enabled', 'card_enabled', 'imps_neft_enabled', 'offer_2_plus_1_enabled'].includes(row.key)) {
      settings[row.key] = row.value === '1' || row.value === 'true';
    } else {
      settings[row.key] = row.value;
    }
  }

  res.json({ settings: settings as StoreSettings });
});

// Update settings (Super Admin only for sensitive/owner settings)
router.put('/', requireRole(['SUPER_ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const newSettings = req.body;
  if (!newSettings || typeof newSettings !== 'object') {
    return res.status(400).json({ error: 'Invalid settings payload' });
  }

  const prevRows = query<{ key: string; value: string }>('SELECT key, value FROM store_settings');
  const prevMap = Object.fromEntries(prevRows.map(r => [r.key, r.value]));

  for (const [key, value] of Object.entries(newSettings)) {
    let strVal: string;
    if (typeof value === 'boolean') {
      strVal = value ? '1' : '0';
    } else {
      strVal = String(value);
    }
    run('INSERT OR REPLACE INTO store_settings (key, value) VALUES (?, ?)', [key, strVal]);
  }

  recordAudit(req, 'STORE_SETTINGS', 'global', 'UPDATE_SETTINGS', prevMap, newSettings);
  broadcastEvent('settings_updated', newSettings);

  res.json({ success: true, message: 'Settings updated successfully' });
});

// Get Audit Logs (Authorized staff only)
router.get('/audit-logs', requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_CASHIER']), (req: AuthenticatedRequest, res: Response) => {
  const logs = query<AuditLog>('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 100');
  res.json({ logs });
});

export default router;
