import { queryOne, run, transaction } from '../db/database.js';

export interface StockAdjustmentParams {
  variantId: string;
  quantityChange: number; // positive for intake, negative for deduction
  changeType: 'PURCHASE_RECEIPT' | 'ORDER_DEDUCTION' | 'RETURN_RESTOCK' | 'MANUAL_ADJUSTMENT' | 'DAMAGE_WRITE_OFF';
  referenceNote?: string;
  actorName: string;
}

export function adjustInventory(params: StockAdjustmentParams): { success: boolean; newQuantity: number; error?: string } {
  return transaction(() => {
    const variant = queryOne<{
      id: string;
      sku: string;
      quantity: number;
      product_id: string;
      product_name: string;
    }>(
      `SELECT v.id, v.sku, v.quantity, v.product_id, p.name as product_name 
       FROM product_variants v 
       JOIN products p ON v.product_id = p.id 
       WHERE v.id = ?`,
      [params.variantId]
    );

    if (!variant) {
      throw new Error(`Variant ${params.variantId} not found`);
    }

    const newQuantity = variant.quantity + params.quantityChange;

    if (newQuantity < 0) {
      throw new Error(`Inventory Protection: Quantity cannot go below zero for SKU ${variant.sku}. Current: ${variant.quantity}, Requested change: ${params.quantityChange}`);
    }

    // Update variant stock
    run('UPDATE product_variants SET quantity = ? WHERE id = ?', [newQuantity, variant.id]);

    // Record inventory movement
    const movementId = 'mov-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const now = new Date().toISOString();

    run(`INSERT INTO inventory_movements (
      id, variant_id, sku, product_name, change_type, quantity_changed, quantity_after, reference_note, actor_name, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
      movementId,
      variant.id,
      variant.sku,
      variant.product_name,
      params.changeType,
      params.quantityChange,
      newQuantity,
      params.referenceNote || '',
      params.actorName,
      now
    ]);

    return { success: true, newQuantity };
  });
}
