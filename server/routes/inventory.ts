import { Router, Response } from 'express';
import { query, queryOne } from '../db/database.js';
import { AuthenticatedRequest, isCostPriceAllowed, requireRole } from '../middleware/auth.js';
import { adjustInventory } from '../services/inventoryService.js';
import { recordAudit } from '../middleware/audit.js';
import { broadcastEvent } from './events.js';
import { InventoryMovement } from '../../shared/types.js';

const router = Router();

// GET all inventory items (matrix view)
router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'INVENTORY_EXECUTIVE', 'HEAD_CASHIER']), (req: AuthenticatedRequest, res: Response) => {
  const items = query<any>(`
    SELECT 
      v.id as variant_id,
      v.product_id,
      p.name as product_name,
      p.status as product_status,
      c.name as category_name,
      v.sku,
      v.size,
      v.color,
      v.color_code,
      v.cost_price,
      v.selling_price,
      v.sale_price,
      v.quantity,
      v.low_stock_threshold,
      (v.quantity <= v.low_stock_threshold AND v.quantity > 0) as is_low_stock,
      (v.quantity = 0) as is_out_of_stock
    FROM product_variants v
    JOIN products p ON v.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    ORDER BY p.name ASC, v.sku ASC
  `);

  const canSeeCost = isCostPriceAllowed(req.user?.role);
  const safeItems = items.map(item => {
    if (!canSeeCost) {
      delete item.cost_price;
    }
    return item;
  });

  res.json({ items: safeItems });
});

// Receive Stock (Purchase Order / intake)
router.post('/receive', requireRole(['SUPER_ADMIN', 'ADMIN', 'INVENTORY_EXECUTIVE']), (req: AuthenticatedRequest, res: Response) => {
  const { variant_id, quantity, reference_note } = req.body;
  const qty = parseInt(quantity, 10);

  if (!variant_id || isNaN(qty) || qty <= 0) {
    return res.status(400).json({ error: 'Valid variant ID and positive quantity (1 to infinity) are required. Negative or zero inventory is strictly forbidden.' });
  }

  try {
    const result = adjustInventory({
      variantId: variant_id,
      quantityChange: qty,
      changeType: 'PURCHASE_RECEIPT',
      referenceNote: reference_note || 'Stock intake from weaver workshop',
      actorName: req.user?.name || 'Inventory Executive'
    });

    recordAudit(req, 'INVENTORY', variant_id, 'RECEIVE_STOCK', null, { variant_id, quantity: qty, new_quantity: result.newQuantity, reference_note });
    broadcastEvent('inventory_updated', { variant_id, new_quantity: result.newQuantity });

    res.json({ success: true, new_quantity: result.newQuantity });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// Manual Stock Adjustment (damages, write-offs, recount corrections)
router.post('/adjust', requireRole(['SUPER_ADMIN', 'ADMIN', 'INVENTORY_EXECUTIVE']), (req: AuthenticatedRequest, res: Response) => {
  const { variant_id, quantity_change, reason, change_type = 'MANUAL_ADJUSTMENT' } = req.body;
  const change = parseInt(quantity_change, 10);

  if (!variant_id || isNaN(change) || change === 0) {
    return res.status(400).json({ error: 'Valid variant ID and non-zero quantity change are required' });
  }
  if (!reason || reason.trim().length === 0) {
    return res.status(400).json({ error: 'Mandatory adjustment reason must be provided for audit tracking' });
  }

  try {
    const result = adjustInventory({
      variantId: variant_id,
      quantityChange: change,
      changeType: change_type,
      referenceNote: reason,
      actorName: req.user?.name || 'Inventory Controller'
    });

    recordAudit(req, 'INVENTORY', variant_id, 'MANUAL_ADJUST', null, { variant_id, change, new_quantity: result.newQuantity, reason });
    broadcastEvent('inventory_updated', { variant_id, new_quantity: result.newQuantity });

    res.json({ success: true, new_quantity: result.newQuantity });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET inventory movement history
router.get('/movements', requireRole(['SUPER_ADMIN', 'ADMIN', 'INVENTORY_EXECUTIVE']), (req: AuthenticatedRequest, res: Response) => {
  const movements = query<InventoryMovement>('SELECT * FROM inventory_movements ORDER BY created_at DESC LIMIT 100');
  res.json({ movements });
});

export default router;
