import { Router, Response } from 'express';
import { query, queryOne, run, transaction } from '../db/database.js';
import { AuthenticatedRequest, isCostPriceAllowed, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';
import { validateVariantPrices } from '../services/pricingService.js';
import { broadcastEvent } from './events.js';
import { Product, ProductVariant, ProductMedia, Category } from '../../shared/types.js';

const router = Router();

// GET all categories
router.get('/categories', (req: AuthenticatedRequest, res: Response) => {
  const categories = query<Category>('SELECT * FROM categories ORDER BY display_order ASC');
  res.json({ categories });
});

// GET products (with full filtering, searching, and sorting)
router.get('/', (req: AuthenticatedRequest, res: Response) => {
  const {
    search,
    category,
    minPrice,
    maxPrice,
    color,
    fabric,
    inStockOnly,
    onSale,
    sort,
    featured,
    placement,
    status
  } = req.query;

  let sql = `
    SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    JOIN categories c ON p.category_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];

  // Visibility: customers only see PUBLISHED products; staff can filter by status
  if (status && req.user) {
    sql += ' AND p.status = ?';
    params.push(status);
  } else if (!req.user || req.user.role === 'POS_CASHIER') {
    sql += " AND p.status = 'PUBLISHED'";
  }

  if (category) {
    sql += ' AND (c.slug = ? OR c.id = ?)';
    params.push(category, category);
  }

  if (fabric) {
    sql += ' AND LOWER(p.fabric) LIKE ?';
    params.push(`%${String(fabric).toLowerCase()}%`);
  }

  if (featured === 'true' || featured === '1') {
    sql += ' AND p.is_featured = 1';
  }

  if (placement) {
    sql += ' AND p.homepage_placement = ?';
    params.push(placement);
  }

  if (search) {
    sql += ` AND (
      LOWER(p.name) LIKE ? OR 
      LOWER(p.fabric) LIKE ? OR 
      LOWER(p.description) LIKE ? OR
      p.id IN (SELECT product_id FROM product_variants WHERE LOWER(sku) LIKE ? OR LOWER(color) LIKE ?)
    )`;
    const q = `%${String(search).toLowerCase()}%`;
    params.push(q, q, q, q, q);
  }

  const products = query<any>(sql, params);

  // Fetch all variants and media for these products
  if (products.length === 0) {
    return res.json({ products: [] });
  }

  const productIds = products.map(p => p.id);
  const placeholders = productIds.map(() => '?').join(',');

  const allVariants = query<ProductVariant>(
    `SELECT * FROM product_variants WHERE product_id IN (${placeholders})`,
    productIds
  );

  const allMedia = query<ProductMedia>(
    `SELECT * FROM product_media WHERE product_id IN (${placeholders}) ORDER BY sort_order ASC`,
    productIds
  );

  const canSeeCost = isCostPriceAllowed(req.user?.role);

  // Group variants & media by product
  const variantsByProd = new Map<string, ProductVariant[]>();
  for (const v of allVariants) {
    if (!canSeeCost) {
      delete v.cost_price;
    }
    const list = variantsByProd.get(v.product_id) || [];
    list.push(v);
    variantsByProd.set(v.product_id, list);
  }

  const mediaByProd = new Map<string, ProductMedia[]>();
  for (const m of allMedia) {
    const list = mediaByProd.get(m.product_id) || [];
    list.push(m);
    mediaByProd.set(m.product_id, list);
  }

  let fullProducts: Product[] = products.map(p => ({
    ...p,
    is_featured: Boolean(p.is_featured),
    variants: variantsByProd.get(p.id) || [],
    media: mediaByProd.get(p.id) || []
  }));

  // Apply Variant-level filters (price, color, inStockOnly, onSale)
  if (minPrice || maxPrice || color || inStockOnly === 'true' || onSale === 'true') {
    fullProducts = fullProducts.filter(p => {
      return p.variants.some(v => {
        const effectivePrice = v.sale_price && v.sale_price > 0 ? v.sale_price : v.selling_price;
        if (minPrice && effectivePrice < parseFloat(String(minPrice))) return false;
        if (maxPrice && effectivePrice > parseFloat(String(maxPrice))) return false;
        if (color && !v.color.toLowerCase().includes(String(color).toLowerCase())) return false;
        if (inStockOnly === 'true' && v.quantity <= 0) return false;
        if (onSale === 'true' && (!v.sale_price || v.sale_price >= v.selling_price)) return false;
        return true;
      });
    });
  }

  // Sorting
  if (sort === 'price_asc') {
    fullProducts.sort((a, b) => {
      const minA = Math.min(...a.variants.map(v => v.sale_price || v.selling_price));
      const minB = Math.min(...b.variants.map(v => v.sale_price || v.selling_price));
      return minA - minB;
    });
  } else if (sort === 'price_desc') {
    fullProducts.sort((a, b) => {
      const maxA = Math.max(...a.variants.map(v => v.sale_price || v.selling_price));
      const maxB = Math.max(...b.variants.map(v => v.sale_price || v.selling_price));
      return maxB - maxA;
    });
  } else if (sort === 'newest') {
    fullProducts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  res.json({ products: fullProducts });
});

// GET single product by slug or id
router.get('/:slugOrId', (req: AuthenticatedRequest, res: Response) => {
  const { slugOrId } = req.params;

  const product = queryOne<any>(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.slug = ? OR p.id = ?`,
    [slugOrId, slugOrId]
  );

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const canSeeCost = isCostPriceAllowed(req.user?.role);

  const variants = query<ProductVariant>(
    'SELECT * FROM product_variants WHERE product_id = ?',
    [product.id]
  ).map(v => {
    if (!canSeeCost) delete v.cost_price;
    return v;
  });

  const media = query<ProductMedia>(
    'SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order ASC',
    [product.id]
  );

  // Fetch related products in the same category
  const relatedRows = query<any>(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
     FROM products p
     JOIN categories c ON p.category_id = c.id
     WHERE p.category_id = ? AND p.id != ? AND p.status = 'PUBLISHED'
     LIMIT 4`,
    [product.category_id, product.id]
  );

  const related = relatedRows.map(r => {
    const rVariants = query<ProductVariant>('SELECT * FROM product_variants WHERE product_id = ?', [r.id]).map(v => {
      if (!canSeeCost) delete v.cost_price;
      return v;
    });
    const rMedia = query<ProductMedia>('SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order ASC', [r.id]);
    return { ...r, variants: rVariants, media: rMedia };
  });

  res.json({
    product: {
      ...product,
      is_featured: Boolean(product.is_featured),
      variants,
      media
    },
    relatedProducts: related
  });
});

// CREATE Product (Super Admin and Admin)
router.post('/', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const {
    name,
    slug,
    category_id,
    description,
    fabric,
    care_instructions,
    status = 'PUBLISHED',
    is_featured = 0,
    homepage_placement = 'NONE',
    campaign_label,
    seo_title,
    seo_description,
    canonical_url,
    variants = [],
    media = []
  } = req.body;

  if (!name || !category_id || !fabric || variants.length === 0) {
    return res.status(400).json({ error: 'Name, category, fabric, and at least one variant are required' });
  }

  // Validate prices vs costs and non-negative quantities for all variants!
  for (const v of variants) {
    const cost = parseFloat(v.cost_price) || 0;
    const selling = parseFloat(v.selling_price) || 0;
    const sale = v.sale_price ? parseFloat(v.sale_price) : null;
    const check = validateVariantPrices(cost, selling, sale);
    if (!check.valid) {
      return res.status(400).json({ error: `Variant ${v.sku || v.color}: ${check.error}` });
    }
    const variantQty = parseInt(v.quantity, 10);
    if (!isNaN(variantQty) && variantQty < 0) {
      return res.status(400).json({ error: `Initial stock quantity for SKU ${v.sku || v.color} cannot be negative.` });
    }
  }

  const productId = 'prod-' + Date.now().toString(36);
  const genSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const now = new Date().toISOString();

  try {
    transaction(() => {
      run(`INSERT INTO products (
        id, name, slug, category_id, description, fabric, care_instructions,
        status, is_featured, homepage_placement, campaign_label,
        seo_title, seo_description, canonical_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        productId, name, genSlug, category_id, description || '', fabric, care_instructions || '',
        status, is_featured ? 1 : 0, homepage_placement, campaign_label || null,
        seo_title || `${name} | India Fashions`, seo_description || description?.substring(0, 160) || '',
        canonical_url || `https://indiafashions.com/product/${genSlug}`, now, now
      ]);

      for (const v of variants) {
        const vId = 'var-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 5);
        const cost = parseFloat(v.cost_price) || 0;
        const selling = parseFloat(v.selling_price) || 0;
        const sale = v.sale_price ? parseFloat(v.sale_price) : null;
        const qty = parseInt(v.quantity, 10) || 0;

        run(`INSERT INTO product_variants (
          id, product_id, sku, size, color, color_code, cost_price, selling_price, sale_price, quantity, low_stock_threshold
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          vId, productId, v.sku, v.size || 'Free Size', v.color, v.color_code || '#0F5F56',
          cost, selling, sale, qty, v.low_stock_threshold || 3
        ]);

        // Log intake movement
        run(`INSERT INTO inventory_movements (
          id, variant_id, sku, product_name, change_type, quantity_changed, quantity_after, reference_note, actor_name, created_at
        ) VALUES (?, ?, ?, ?, 'PURCHASE_RECEIPT', ?, ?, 'Initial inventory intake', ?, ?)`, [
          'mov-' + vId, vId, v.sku, name, qty, qty, req.user?.name || 'Admin', now
        ]);
      }

      for (let i = 0; i < media.length; i++) {
        const m = media[i];
        const mId = 'med-' + Date.now().toString(36) + '-' + i;
        run(`INSERT INTO product_media (
          id, product_id, file_path, alt_text, sort_order, is_primary, crop_desktop, crop_mobile
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
          mId, productId, m.file_path, m.alt_text || name, i + 1, i === 0 ? 1 : (m.is_primary ? 1 : 0),
          m.crop_desktop || '4:5', m.crop_mobile || '1:1'
        ]);
      }
    });

    recordAudit(req, 'PRODUCT', productId, 'CREATE_PRODUCT', null, { id: productId, name, slug: genSlug });
    broadcastEvent('product_updated', { id: productId, action: 'created' });

    res.status(201).json({ success: true, id: productId, slug: genSlug });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
});

// UPDATE Product (Super Admin and Admin)
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const prev = queryOne('SELECT * FROM products WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Product not found' });

  const {
    name,
    slug,
    category_id,
    description,
    fabric,
    care_instructions,
    status,
    is_featured,
    homepage_placement,
    campaign_label,
    seo_title,
    seo_description,
    canonical_url,
    variants = []
  } = req.body;

  // Validate variant prices if provided
  for (const v of variants) {
    const cost = parseFloat(v.cost_price) || 0;
    const selling = parseFloat(v.selling_price) || 0;
    const sale = v.sale_price ? parseFloat(v.sale_price) : null;
    const check = validateVariantPrices(cost, selling, sale);
    if (!check.valid) {
      return res.status(400).json({ error: `Variant ${v.sku || v.color}: ${check.error}` });
    }
  }

  const now = new Date().toISOString();

  try {
    transaction(() => {
      run(`UPDATE products SET
        name = ?, slug = ?, category_id = ?, description = ?, fabric = ?, care_instructions = ?,
        status = ?, is_featured = ?, homepage_placement = ?, campaign_label = ?,
        seo_title = ?, seo_description = ?, canonical_url = ?, updated_at = ?
        WHERE id = ?`, [
        name, slug, category_id, description, fabric, care_instructions,
        status, is_featured ? 1 : 0, homepage_placement, campaign_label,
        seo_title, seo_description, canonical_url, now, id
      ]);

      if (variants && variants.length > 0) {
        for (const v of variants) {
          if (v.id) {
            run(`UPDATE product_variants SET
              sku = ?, size = ?, color = ?, color_code = ?, cost_price = ?, selling_price = ?, sale_price = ?, low_stock_threshold = ?
              WHERE id = ?`, [
              v.sku, v.size, v.color, v.color_code,
              parseFloat(v.cost_price), parseFloat(v.selling_price), v.sale_price ? parseFloat(v.sale_price) : null,
              v.low_stock_threshold, v.id
            ]);
          }
        }
      }
    });

    recordAudit(req, 'PRODUCT', id, 'UPDATE_PRODUCT', prev, req.body);
    broadcastEvent('product_updated', { id, action: 'updated' });

    res.json({ success: true, message: 'Product updated successfully' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update product' });
  }
});

// DELETE / Archive Product
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const prev = queryOne('SELECT * FROM products WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Product not found' });

  run("UPDATE products SET status = 'ARCHIVED' WHERE id = ?", [id]);
  recordAudit(req, 'PRODUCT', id, 'ARCHIVE_PRODUCT', prev, { status: 'ARCHIVED' });
  broadcastEvent('product_updated', { id, action: 'archived' });

  res.json({ success: true });
});

export default router;
