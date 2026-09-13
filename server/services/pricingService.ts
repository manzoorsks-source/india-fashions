import { query, queryOne } from '../db/database.js';

export interface PriceValidationResult {
  valid: boolean;
  error?: string;
}

export function validateVariantPrices(
  costPrice: number,
  sellingPrice: number,
  salePrice?: number | null
): PriceValidationResult {
  if (costPrice < 0) {
    return { valid: false, error: 'Cost price cannot be negative' };
  }
  if (sellingPrice < costPrice) {
    return {
      valid: false,
      error: `Pricing Protection Violation: Selling price (₹${sellingPrice.toLocaleString('en-IN')}) cannot be lower than product cost price (₹${costPrice.toLocaleString('en-IN')}).`
    };
  }
  if (salePrice !== null && salePrice !== undefined && salePrice !== 0) {
    if (salePrice < costPrice) {
      return {
        valid: false,
        error: `Pricing Protection Violation: Sale price (₹${salePrice.toLocaleString('en-IN')}) cannot be lower than product cost price (₹${costPrice.toLocaleString('en-IN')}).`
      };
    }
    if (salePrice > sellingPrice) {
      return {
        valid: false,
        error: `Invalid Sale Price: Sale price (₹${salePrice.toLocaleString('en-IN')}) cannot exceed regular selling price (₹${sellingPrice.toLocaleString('en-IN')}).`
      };
    }
  }
  return { valid: true };
}

/**
 * 2 + 1 Offer Protection
 * Treat 2 + 1 as a three-unit bundle.
 * The bundle selling total must be greater than or equal to the combined cost of all three selected units.
 * If selected colors or sizes have different costs, calculate using the actual selected SKU costs.
 */
export function validate2Plus1Bundle(
  selectedVariantIds: string[]
): { valid: boolean; discountAmount: number; combinedCost: number; bundleTotalBeforeDiscount: number; bundleTotalAfterDiscount: number; error?: string } {
  if (selectedVariantIds.length < 3) {
    return { valid: true, discountAmount: 0, combinedCost: 0, bundleTotalBeforeDiscount: 0, bundleTotalAfterDiscount: 0 };
  }

  // We evaluate bundles in groups of 3
  const placeholders = selectedVariantIds.map(() => '?').join(',');
  const variants = query<{ id: string; cost_price: number; selling_price: number; sale_price?: number }>(
    `SELECT id, cost_price, selling_price, sale_price FROM product_variants WHERE id IN (${placeholders})`,
    selectedVariantIds
  );

  const variantMap = new Map(variants.map(v => [v.id, v]));

  let totalDiscount = 0;
  let totalCombinedCost = 0;
  let totalBeforeDiscount = 0;
  let totalAfterDiscount = 0;

  // Process bundles in chunks of 3 items sorted by effective price (cheapest gets discounted in 2+1)
  const items = selectedVariantIds.map(id => {
    const v = variantMap.get(id);
    if (!v) throw new Error(`Variant ${id} not found`);
    const effectivePrice = v.sale_price && v.sale_price > 0 ? v.sale_price : v.selling_price;
    return { id: v.id, cost: v.cost_price, price: effectivePrice };
  }).sort((a, b) => a.price - b.price); // Lowest price first for 2+1 free unit

  const bundleCount = Math.floor(items.length / 3);

  for (let b = 0; b < bundleCount; b++) {
    // In each triplet: items[b] is the free item candidate, items[items.length - 1 - (b*2)] and ... are higher priced
    // For standard 2+1: cheapest item in the triplet is discounted
    const triplet = [
      items[b],
      items[items.length - 1 - (b * 2)],
      items[items.length - 2 - (b * 2)]
    ];

    const tripletCost = triplet.reduce((sum, item) => sum + item.cost, 0);
    const tripletSellingTotal = triplet.reduce((sum, item) => sum + item.price, 0);
    const potentialDiscount = triplet[0].price; // cheapest item free
    const discountedTripletTotal = tripletSellingTotal - potentialDiscount;

    // RULE: The bundle selling total must be greater than or equal to the combined cost of all three selected units!
    if (discountedTripletTotal < tripletCost) {
      // If discounted price would fall below combined cost, cap the discount so selling total >= combined cost
      const allowedDiscount = Math.max(0, tripletSellingTotal - tripletCost);
      totalDiscount += allowedDiscount;
      totalCombinedCost += tripletCost;
      totalBeforeDiscount += tripletSellingTotal;
      totalAfterDiscount += (tripletSellingTotal - allowedDiscount);
    } else {
      totalDiscount += potentialDiscount;
      totalCombinedCost += tripletCost;
      totalBeforeDiscount += tripletSellingTotal;
      totalAfterDiscount += discountedTripletTotal;
    }
  }

  // Check overall protection rule
  if (totalAfterDiscount < totalCombinedCost) {
    return {
      valid: false,
      discountAmount: 0,
      combinedCost: totalCombinedCost,
      bundleTotalBeforeDiscount: totalBeforeDiscount,
      bundleTotalAfterDiscount: totalAfterDiscount,
      error: `2+1 Offer Protection Violation: Bundle selling price (₹${totalAfterDiscount.toLocaleString('en-IN')}) cannot be lower than the combined cost of the 3 selected items (₹${totalCombinedCost.toLocaleString('en-IN')}).`
    };
  }

  return {
    valid: true,
    discountAmount: Math.round(totalDiscount),
    combinedCost: totalCombinedCost,
    bundleTotalBeforeDiscount: totalBeforeDiscount,
    bundleTotalAfterDiscount: totalAfterDiscount
  };
}
