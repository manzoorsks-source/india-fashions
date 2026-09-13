import { Router, Response } from 'express';
import { query, queryOne, run } from '../db/database.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';
import { broadcastEvent } from './events.js';
import { AdvanceOrder } from '../../shared/types.js';

const router = Router();

// Customer: Submit an Advance Order for out-of-stock item
router.post('/', (req: AuthenticatedRequest, res: Response) => {
  const { product_id, variant_id, customer_name, customer_phone, customer_email, notes } = req.body;

  if (!product_id || !variant_id || !customer_name || !customer_phone) {
    return res.status(400).json({ error: 'Product, variant, customer name, and contact phone are required' });
  }

  const product = queryOne<{ name: string }>('SELECT name FROM products WHERE id = ?', [product_id]);
  const variant = queryOne<{ color: string; sku: string }>('SELECT color, sku FROM product_variants WHERE id = ?', [variant_id]);

  if (!product || !variant) {
    return res.status(404).json({ error: 'Product or variant not found' });
  }

  const id = 'adv-' + Date.now().toString(36);
  const now = new Date().toISOString();
  const variantDetails = `${variant.color} (${variant.sku})`;

  run(`INSERT INTO advance_orders (
    id, product_id, product_name, variant_id, variant_details,
    customer_name, customer_phone, customer_email, notes, status, notification_sent, created_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', 0, ?)`, [
    id, product_id, product.name, variant_id, variantDetails,
    customer_name, customer_phone, customer_email || '', notes || '', now
  ]);

  broadcastEvent('advance_order_created', { id, product_name: product.name, customer_name });

  res.status(201).json({
    success: true,
    message: 'Your advance order request has been received! Our boutique master weaver concierge will contact you upon loom completion.',
    advanceOrderId: id
  });
});

// Admin: View advance orders queue
router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_CASHIER', 'INVENTORY_EXECUTIVE']), (req: AuthenticatedRequest, res: Response) => {
  const advanceOrders = query<AdvanceOrder>('SELECT * FROM advance_orders ORDER BY created_at DESC');
  res.json({ advanceOrders });
});

// Admin: Confirm allocation or update status
router.put('/:id/status', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status, notification_sent } = req.body;

  const prev = queryOne<AdvanceOrder>('SELECT * FROM advance_orders WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Advance order not found' });

  const now = new Date().toISOString();
  let allocatedAt = prev.allocated_at;
  if (status === 'ALLOCATED' && !allocatedAt) {
    allocatedAt = now;
  }

  run(`UPDATE advance_orders SET
    status = ?, notification_sent = ?, allocated_at = ?
    WHERE id = ?`, [
    status || prev.status,
    notification_sent !== undefined ? (notification_sent ? 1 : 0) : prev.notification_sent,
    allocatedAt,
    id
  ]);

  recordAudit(req, 'ADVANCE_ORDER', id, 'UPDATE_ADVANCE_ORDER', prev, { status, notification_sent });
  broadcastEvent('advance_order_updated', { id, status });

  res.json({ success: true });
});

export default router;
