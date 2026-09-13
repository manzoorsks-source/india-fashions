import { Router, Response } from 'express';
import { query, queryOne, run, transaction } from '../db/database.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';
import { adjustInventory } from '../services/inventoryService.js';
import { validate2Plus1Bundle } from '../services/pricingService.js';
import { validateDeliveryLocation } from '../services/deliveryService.js';
import { broadcastEvent } from './events.js';
import { Order, OrderItem, PaymentMethod, PaymentStatus, OrderStatus } from '../../shared/types.js';

const router = Router();

// CHECKOUT: Place order (server-side atomic validation, 12km check, pricing protection, 2+1 check)
router.post('/checkout', (req: AuthenticatedRequest, res: Response) => {
  const {
    customer_name,
    customer_phone,
    customer_email,
    delivery_address,
    pincode,
    customer_lat,
    customer_lon,
    payment_method,
    payment_reference,
    customer_notes,
    items = [], // Array of { variant_id: string, quantity: number }
    coupon_code
  } = req.body;

  // 1. Basic validation
  if (!customer_name || !customer_phone || !delivery_address || items.length === 0) {
    return res.status(400).json({ error: 'Customer name, phone, delivery address, and at least one item are required' });
  }

  // 2. 12 km Delivery radius verification
  const deliveryCheck = validateDeliveryLocation(customer_lat, customer_lon, pincode);
  if (!deliveryCheck.isEligible) {
    return res.status(400).json({ error: deliveryCheck.error });
  }

  // 3. Payment method eligibility
  const settingsRows = query<{ key: string; value: string }>('SELECT key, value FROM store_settings');
  const settingsMap = Object.fromEntries(settingsRows.map(r => [r.key, r.value]));

  if (payment_method === 'COD' && settingsMap.cod_enabled !== '1' && settingsMap.cod_enabled !== 'true') {
    return res.status(400).json({ error: 'Cash on Delivery is currently disabled by store management' });
  }

  if (payment_method === 'IMPS_NEFT' && (!payment_reference || payment_reference.trim().length === 0)) {
    return res.status(400).json({ error: 'Bank Transaction Reference (UTR number) is required for IMPS / NEFT payment verification' });
  }

  try {
    const createdOrder = transaction(() => {
      // 4. Server-Side Stock & Price Re-check inside transaction
      let subtotal = 0;
      const orderItemsToInsert: any[] = [];
      const expandedVariantIdsForBundle: string[] = [];

      for (const item of items) {
        const qty = parseInt(item.quantity, 10);
        if (isNaN(qty) || qty <= 0) {
          throw new Error('Invalid item quantity');
        }

        const variant = queryOne<any>(`
          SELECT v.*, p.name as product_name, p.status as product_status 
          FROM product_variants v 
          JOIN products p ON v.product_id = p.id 
          WHERE v.id = ?
        `, [item.variant_id]);

        if (!variant) {
          throw new Error(`Variant ${item.variant_id} does not exist`);
        }

        if (variant.product_status !== 'PUBLISHED') {
          throw new Error(`Product ${variant.product_name} is no longer available`);
        }

        // Check stock
        if (variant.quantity < qty) {
          throw new Error(`Insufficient stock for "${variant.product_name} (${variant.color})". Available: ${variant.quantity}, Requested: ${qty}`);
        }

        const effectivePrice = variant.sale_price && variant.sale_price > 0 ? variant.sale_price : variant.selling_price;
        const lineTotal = effectivePrice * qty;
        subtotal += lineTotal;

        for (let i = 0; i < qty; i++) {
          expandedVariantIdsForBundle.push(variant.id);
        }

        orderItemsToInsert.push({
          variant_id: variant.id,
          product_id: variant.product_id,
          product_name: variant.product_name,
          sku: variant.sku,
          size: variant.size,
          color: variant.color,
          unit_price: effectivePrice,
          quantity: qty,
          total_price: lineTotal
        });
      }

      // 5. 2 + 1 Bundle Rule check and Coupon calculation
      let discountAmount = 0;
      if (settingsMap.offer_2_plus_1_enabled === '1' && expandedVariantIdsForBundle.length >= 3) {
        const bundleCheck = validate2Plus1Bundle(expandedVariantIdsForBundle);
        if (!bundleCheck.valid) {
          throw new Error(bundleCheck.error || '2+1 bundle price violated cost protection');
        }
        discountAmount += bundleCheck.discountAmount;
      }

      // Simple coupons
      if (coupon_code) {
        const code = coupon_code.toUpperCase().trim();
        if (code === 'FESTIVE10') {
          discountAmount += Math.round(subtotal * 0.10);
        } else if (code === 'WELCOME5') {
          discountAmount += Math.round(subtotal * 0.05);
        }
      }

      // 6. Delivery charge calculation
      const freeThreshold = parseFloat(settingsMap.free_delivery_threshold) || 2999;
      const baseDelivery = parseFloat(settingsMap.delivery_base_charge) || 50;
      const deliveryCharge = (subtotal - discountAmount) >= freeThreshold ? 0 : baseDelivery;

      // Tax placeholder (e.g. 5% GST included or calculated)
      const taxAmount = Math.round((subtotal - discountAmount) * 0.05);
      const totalAmount = Math.max(0, subtotal - discountAmount + deliveryCharge);

      // 7. Determine initial payment status
      let paymentStatus: PaymentStatus = 'PENDING';
      if (payment_method === 'UPI' || payment_method === 'CARD') {
        paymentStatus = 'PAID';
      } else if (payment_method === 'IMPS_NEFT') {
        paymentStatus = 'VERIFICATION_REQUIRED';
      }

      const orderId = 'ord-' + Date.now().toString(36);
      const orderNumber = 'IF-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000);
      const now = new Date().toISOString();

      // Insert order
      run(`INSERT INTO orders (
        id, order_number, customer_name, customer_phone, customer_email, delivery_address,
        pincode, distance_km, subtotal, discount_amount, delivery_charge, tax_amount,
        total_amount, status, payment_method, payment_status, payment_reference, customer_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PLACED', ?, ?, ?, ?, ?, ?)`, [
        orderId, orderNumber, customer_name, customer_phone, customer_email || '', delivery_address,
        pincode || '', deliveryCheck.distanceKm, subtotal, discountAmount, deliveryCharge, taxAmount,
        totalAmount, payment_method, paymentStatus, payment_reference || null, customer_notes || '', now, now
      ]);

      // Deduct stock & insert items
      for (const oi of orderItemsToInsert) {
        const oiId = 'oi-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
        run(`INSERT INTO order_items (
          id, order_id, product_id, variant_id, product_name, sku, size, color, unit_price, quantity, total_price
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          oiId, orderId, oi.product_id, oi.variant_id, oi.product_name, oi.sku, oi.size, oi.color, oi.unit_price, oi.quantity, oi.total_price
        ]);

        // Atomic inventory deduction
        adjustInventory({
          variantId: oi.variant_id,
          quantityChange: -oi.quantity,
          changeType: 'ORDER_DEDUCTION',
          referenceNote: `Order #${orderNumber}`,
          actorName: `Customer (${customer_name})`
        });
      }

      return {
        orderId,
        orderNumber,
        totalAmount,
        paymentStatus,
        distanceKm: deliveryCheck.distanceKm
      };
    });

    broadcastEvent('order_placed', { orderId: createdOrder.orderId, orderNumber: createdOrder.orderNumber });
    broadcastEvent('inventory_updated', { reason: 'order_checkout' });

    res.status(201).json({
      success: true,
      order: createdOrder,
      message: createdOrder.paymentStatus === 'VERIFICATION_REQUIRED'
        ? 'Order placed! Your IMPS / NEFT payment reference has been submitted to the Head Cashier for verification.'
        : 'Order placed successfully!'
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to place order' });
  }
});

// Admin: Get orders list with search and filters
router.get('/', requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_CASHIER', 'POS_CASHIER']), (req: AuthenticatedRequest, res: Response) => {
  const { status, payment_status, payment_method, search } = req.query;

  let sql = 'SELECT * FROM orders WHERE 1=1';
  const params: any[] = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (payment_status) {
    sql += ' AND payment_status = ?';
    params.push(payment_status);
  }
  if (payment_method) {
    sql += ' AND payment_method = ?';
    params.push(payment_method);
  }
  if (search) {
    sql += ' AND (order_number LIKE ? OR customer_name LIKE ? OR customer_phone LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q);
  }

  sql += ' ORDER BY created_at DESC';

  const orders = query<Order>(sql, params);
  res.json({ orders });
});

// GET single order with full details and tracking
router.get('/:idOrNumber', (req: AuthenticatedRequest, res: Response) => {
  const { idOrNumber } = req.params;

  const order = queryOne<Order>(
    'SELECT * FROM orders WHERE id = ? OR order_number = ?',
    [idOrNumber, idOrNumber]
  );

  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const items = query<OrderItem>(
    'SELECT * FROM order_items WHERE order_id = ?',
    [order.id]
  );

  res.json({ order: { ...order, items } });
});

// Admin: Update order fulfillment status (Placed -> Confirmed -> Packed -> Shipped -> Delivered)
router.put('/:id/status', requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_CASHIER']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: OrderStatus };

  const validStatuses: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: `Invalid status: ${status}` });
  }

  const prev = queryOne<Order>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Order not found' });

  const now = new Date().toISOString();
  run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [status, now, id]);

  recordAudit(req, 'ORDER', id, 'UPDATE_ORDER_STATUS', { status: prev.status }, { status });
  broadcastEvent('order_updated', { id, status });

  res.json({ success: true, status });
});

// Head Cashier / Admin: Verify IMPS / NEFT payment
router.post('/:id/verify-payment', requireRole(['SUPER_ADMIN', 'ADMIN', 'HEAD_CASHIER']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { approved, note } = req.body; // boolean

  const order = queryOne<Order>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const newStatus: PaymentStatus = approved ? 'PAID' : 'FAILED';
  const newOrderStatus: OrderStatus = approved ? 'CONFIRMED' : 'CANCELLED';
  const now = new Date().toISOString();

  run('UPDATE orders SET payment_status = ?, status = ?, updated_at = ? WHERE id = ?', [
    newStatus, newOrderStatus, now, id
  ]);

  recordAudit(req, 'ORDER_PAYMENT', id, approved ? 'VERIFY_IMPS_APPROVED' : 'VERIFY_IMPS_REJECTED', { payment_status: order.payment_status }, { payment_status: newStatus, note });
  broadcastEvent('order_updated', { id, payment_status: newStatus, status: newOrderStatus });

  res.json({ success: true, payment_status: newStatus, order_status: newOrderStatus });
});

// Process Refund / Return
router.post('/:id/refund', requireRole(['SUPER_ADMIN', 'HEAD_CASHIER']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { reason, restock_items } = req.body;

  const order = queryOne<Order>('SELECT * FROM orders WHERE id = ?', [id]);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  transaction(() => {
    const now = new Date().toISOString();
    run("UPDATE orders SET payment_status = 'REFUNDED', status = 'RETURNED', updated_at = ? WHERE id = ?", [now, id]);

    if (restock_items) {
      const items = query<OrderItem>('SELECT * FROM order_items WHERE order_id = ?', [id]);
      for (const item of items) {
        adjustInventory({
          variantId: item.variant_id,
          quantityChange: item.quantity,
          changeType: 'RETURN_RESTOCK',
          referenceNote: `Restock from refunded order ${order.order_number}: ${reason || ''}`,
          actorName: req.user?.name || 'Head Cashier'
        });
      }
    }
  });

  recordAudit(req, 'ORDER', id, 'PROCESS_REFUND', { payment_status: order.payment_status }, { payment_status: 'REFUNDED', reason });
  broadcastEvent('order_updated', { id, payment_status: 'REFUNDED', status: 'RETURNED' });

  res.json({ success: true });
});

export default router;
