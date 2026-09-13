import { Router, Response } from 'express';
import { query, queryOne, run, transaction, saveDb } from '../db/database.js';
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
    const safeMedia = { ...m, is_primary: Boolean(m.is_primary) };
    const list = mediaByProd.get(m.product_id) || [];
    list.push(safeMedia);
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
  ).map(m => ({ ...m, is_primary: Boolean(m.is_primary) }));

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

      const mediaList = (media && media.length > 0) ? media : [{
        file_path: (req.body.photo_url && String(req.body.photo_url).trim()) || 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80',
        alt_text: name,
        is_primary: 1
      }];

      for (let i = 0; i < mediaList.length; i++) {
        const m = mediaList[i];
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
    photo_url,
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

      // Update or insert primary photo if photo_url was passed
      if (photo_url && typeof photo_url === 'string' && photo_url.trim()) {
        const trimmedPhoto = photo_url.trim();
        const existingPrimary = queryOne<{ id: string; file_path: string }>(
          'SELECT id, file_path FROM product_media WHERE product_id = ? AND is_primary = 1',
          [id]
        );
        const existingAny = queryOne<{ id: string; file_path: string }>(
          'SELECT id, file_path FROM product_media WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1',
          [id]
        );

        if (existingPrimary) {
          run('UPDATE product_media SET file_path = ? WHERE id = ?', [trimmedPhoto, existingPrimary.id]);
        } else if (existingAny) {
          run('UPDATE product_media SET file_path = ?, is_primary = 1 WHERE id = ?', [trimmedPhoto, existingAny.id]);
        } else {
          const mediaId = 'med-' + Date.now().toString(36) + '-0';
          run(`INSERT INTO product_media (
            id, product_id, file_path, alt_text, sort_order, is_primary, crop_desktop, crop_mobile
          ) VALUES (?, ?, ?, ?, 1, 1, '4:5', '1:1')`, [
            mediaId, id, trimmedPhoto, name || 'Product image'
          ]);
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

// Demo Category Products for Punjabi Dresses, Kurtis, Lehengas, and Children
export const demoCategoryProducts = [
  // 1. PUNJABI DRESSES
  {
    id: 'prod-pjb-chanderi-surat',
    name: 'Surat Embroidered Chanderi Silk Punjabi Suit',
    slug: 'surat-embroidered-chanderi-silk-punjabi-suit',
    category_id: 'cat-punjabi',
    description: 'Direct from Surat artisan clusters, this lavish 3-piece unstitched suit material features ornate resham threadwork, a woven zari neckline, santoon inner bottom, and a regal digital print organza dupatta.',
    fabric: 'Pure Chanderi Silk with Zari & Resham Threadwork',
    care_instructions: 'Dry clean only. Gentle steam press on reverse.',
    status: 'PUBLISHED',
    is_featured: 1,
    homepage_placement: 'FEATURED',
    campaign_label: 'Surat Special',
    variants: [
      { id: 'var-sur-01', sku: 'SUR-PJB-01', size: 'Unstitched (Up to 44 Bust)', color: 'Royal Navy Blue & Rani Pink', color_code: '#102A43', cost_price: 1200, selling_price: 2499, sale_price: 1999, quantity: 15, low_stock_threshold: 3 },
      { id: 'var-sur-02', sku: 'SUR-PJB-02', size: 'Unstitched (Up to 44 Bust)', color: 'Emerald Green & Antique Gold', color_code: '#0F5F56', cost_price: 1200, selling_price: 2499, sale_price: 2199, quantity: 10, low_stock_threshold: 3 }
    ],
    media: [
      { id: 'med-sur-01', file_path: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', alt_text: 'Surat embroidered Chanderi silk Punjabi suit set', sort_order: 1, is_primary: 1 }
    ]
  },
  {
    id: 'prod-pjb-patiala-silk',
    name: 'Patiala Heavy Zari Weave Silk Salwar Suit',
    slug: 'patiala-heavy-zari-weave-silk-salwar-suit',
    category_id: 'cat-punjabi',
    description: 'Festive bridal Patiala silhouette adorned with traditional gota patti borders, rich jacquard woven kurti, and heavy pleated Patiala salwar with contrasting Banarasi zari dupatta.',
    fabric: 'Banarasi Art Silk with Heavy Jacquard Weave',
    care_instructions: 'Strictly dry clean. Preserve in soft muslin cloth.',
    status: 'PUBLISHED',
    is_featured: 1,
    homepage_placement: 'NEW_ARRIVAL',
    campaign_label: 'Festive edit',
    variants: [
      { id: 'var-pat-01', sku: 'PAT-ZAR-01', size: 'Semi-Stitched (M to XXL)', color: 'Mustard Gold with Maroon Dupatta', color_code: '#D4AF37', cost_price: 1800, selling_price: 3499, sale_price: 2999, quantity: 12, low_stock_threshold: 3 },
      { id: 'var-pat-02', sku: 'PAT-ZAR-02', size: 'Semi-Stitched (M to XXL)', color: 'Crimson Red with Antique Gold', color_code: '#6A1B29', cost_price: 1800, selling_price: 3499, sale_price: 2999, quantity: 8, low_stock_threshold: 3 }
    ],
    media: [
      { id: 'med-pat-01', file_path: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', alt_text: 'Patiala silk salwar suit with heavy zari weave', sort_order: 1, is_primary: 1 }
    ]
  },
  {
    id: 'prod-pjb-georgette-anarkali',
    name: 'Georgette Anarkali Festive Designer Suit',
    slug: 'georgette-anarkali-festive-designer-suit',
    category_id: 'cat-punjabi',
    description: 'Graceful floor-length 56-inch flare Anarkali suit with delicate sequin coding embroidery, micro cotton inner lining, and embroidered nazneen dupatta with 4-side lace.',
    fabric: 'Heavy Faux Georgette with 5mm Sequence Embroidery',
    care_instructions: 'Dry clean only.',
    status: 'PUBLISHED',
    is_featured: 0,
    homepage_placement: 'FEATURED',
    campaign_label: 'Designer pick',
    variants: [
      { id: 'var-ank-01', sku: 'ANK-GEO-01', size: 'Free Size Stitched (XL)', color: 'Teal Peacock Blue', color_code: '#005F73', cost_price: 1600, selling_price: 3199, sale_price: 2699, quantity: 14, low_stock_threshold: 2 },
      { id: 'var-ank-02', sku: 'ANK-GEO-02', size: 'Free Size Stitched (XL)', color: 'Festive Dusty Rose', color_code: '#B85D6F', cost_price: 1600, selling_price: 3199, sale_price: 2699, quantity: 9, low_stock_threshold: 2 }
    ],
    media: [
      { id: 'med-ank-01', file_path: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80', alt_text: 'Designer Anarkali festive flared suit', sort_order: 1, is_primary: 1 }
    ]
  },

  // 2. KURTIS
  {
    id: 'prod-krt-lucknowi-chikankari',
    name: 'Lucknowi Chikankari Hand Embroidered Silk Kurti Set',
    slug: 'lucknowi-chikankari-hand-embroidered-silk-kurti-set',
    category_id: 'cat-kurti',
    description: 'Handcrafted by master artisans of Lucknow, featuring intricate shadow work, phanda, and tepchi stitches embellished with delicate golden mukaish dots and matching cigarette pants.',
    fabric: 'Mulmul Silk Blend with Authentic Chikankari & Mukaish',
    care_instructions: 'Gentle hand wash in cold water or dry clean.',
    status: 'PUBLISHED',
    is_featured: 1,
    homepage_placement: 'FEATURED',
    campaign_label: 'Handcrafted',
    variants: [
      { id: 'var-luk-01', sku: 'LUK-CHK-01', size: 'M (38)', color: 'Ivory Gold', color_code: '#FAF7F2', cost_price: 950, selling_price: 1899, sale_price: 1599, quantity: 18, low_stock_threshold: 4 },
      { id: 'var-luk-02', sku: 'LUK-CHK-02', size: 'L (40)', color: 'Sky Powder Blue', color_code: '#A0C4E2', cost_price: 950, selling_price: 1899, sale_price: 1599, quantity: 15, low_stock_threshold: 4 }
    ],
    media: [
      { id: 'med-luk-01', file_path: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&w=1000&q=80', alt_text: 'Lucknowi Chikankari silk kurti set', sort_order: 1, is_primary: 1 }
    ]
  },
  {
    id: 'prod-krt-banarasi-brocade',
    name: 'Banarasi Brocade Straight Cut Partywear Kurti',
    slug: 'banarasi-brocade-straight-cut-partywear-kurti',
    category_id: 'cat-kurti',
    description: 'Sleek regal straight silhouette woven with metallic antique gold floral jaal, boat neckline with potli button accents, paired with raw silk culottes.',
    fabric: 'Pure Katan Silk Brocade with Zari Bootis',
    care_instructions: 'Dry clean only.',
    status: 'PUBLISHED',
    is_featured: 1,
    homepage_placement: 'NEW_ARRIVAL',
    campaign_label: 'New arrival',
    variants: [
      { id: 'var-ban-01', sku: 'BAN-KRT-01', size: 'L (40)', color: 'Deep Crimson Maroon', color_code: '#6A1B29', cost_price: 1100, selling_price: 2199, sale_price: 1899, quantity: 11, low_stock_threshold: 3 },
      { id: 'var-ban-02', sku: 'BAN-KRT-02', size: 'XL (42)', color: 'Royal Emerald Green', color_code: '#0F5F56', cost_price: 1100, selling_price: 2199, sale_price: 1899, quantity: 8, low_stock_threshold: 3 }
    ],
    media: [
      { id: 'med-ban-01', file_path: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=80', alt_text: 'Banarasi brocade festive straight kurti', sort_order: 1, is_primary: 1 }
    ]
  },

  // 3. LEHENGAS
  {
    id: 'prod-lh-banarasi-bridal',
    name: 'Royal Banarasi Silk Semi-Stitched Bridal Lehenga',
    slug: 'royal-banarasi-silk-semi-stitched-bridal-lehenga',
    category_id: 'cat-lehenga',
    description: 'A royal heirloom celebratory lehenga ensemble boasting a 4.2-meter circular kalidar ghera with temple kalash motifs, accompanied by an unstitched heavy brocade blouse piece and matching woven organza dupatta.',
    fabric: 'Pure Handloom Katan Silk with Kadwa Antique Gold Zari',
    care_instructions: 'Strictly dry clean. Store wrapped in unbleached muslin.',
    status: 'PUBLISHED',
    is_featured: 1,
    homepage_placement: 'HERO',
    campaign_label: 'Bridal Heritage',
    variants: [
      { id: 'var-lhb-01', sku: 'LH-BAN-01', size: 'Free Size (Up to 42 Waist)', color: 'Royal Crimson & Antique Zari', color_code: '#6A1B29', cost_price: 9500, selling_price: 16999, sale_price: 14500, quantity: 6, low_stock_threshold: 2 },
      { id: 'var-lhb-02', sku: 'LH-BAN-02', size: 'Free Size (Up to 42 Waist)', color: 'Deep Wine Purple', color_code: '#4A154B', cost_price: 9500, selling_price: 16999, sale_price: 14500, quantity: 4, low_stock_threshold: 2 }
    ],
    media: [
      { id: 'med-lhb-01', file_path: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?auto=format&fit=crop&w=1000&q=80', alt_text: 'Royal Banarasi silk bridal lehenga ensemble', sort_order: 1, is_primary: 1 }
    ]
  },
  {
    id: 'prod-lh-velvet-zari',
    name: 'Velvet Heavy Zari Embroidered Festive Lehenga Choli',
    slug: 'velvet-heavy-zari-embroidered-festive-lehenga-choli',
    category_id: 'cat-lehenga',
    description: 'Opulent winter festive and wedding reception drape in lush micro velvet, featuring intricate dori embroidery, double cancan under-layer, and dual shaded soft net dupatta.',
    fabric: 'Micro Velvet with Dori, Badla & Sequin Craftsmanship',
    care_instructions: 'Dry clean only. Steam press gently.',
    status: 'PUBLISHED',
    is_featured: 1,
    homepage_placement: 'FEATURED',
    campaign_label: 'Festive edit',
    variants: [
      { id: 'var-lhv-01', sku: 'LH-VEL-01', size: 'Semi-Stitched (Up to 44 Waist)', color: 'Emerald Green & Heritage Gold', color_code: '#0F5F56', cost_price: 7500, selling_price: 13999, sale_price: 11999, quantity: 5, low_stock_threshold: 2 },
      { id: 'var-lhv-02', sku: 'LH-VEL-02', size: 'Semi-Stitched (Up to 44 Waist)', color: 'Midnight Royal Navy', color_code: '#102A43', cost_price: 7500, selling_price: 13999, sale_price: 11999, quantity: 3, low_stock_threshold: 2 }
    ],
    media: [
      { id: 'med-lhv-01', file_path: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1000&q=80', alt_text: 'Velvet heavy zari embroidered festive lehenga', sort_order: 1, is_primary: 1 }
    ]
  },

  // 4. CHILDREN
  {
    id: 'prod-chd-pattu-pavadai',
    name: 'Girls Royal Pattu Pavadai / Silk Lehenga Set',
    slug: 'girls-royal-pattu-pavadai-silk-lehenga-set',
    category_id: 'cat-children',
    description: 'Traditional South Indian Pattu Pavadai for festivals and weddings. Crafted from pure soft silk with gentle cotton inner lining to ensure utmost comfort for delicate skin.',
    fabric: 'Pure Handloom Silk with Gold Temple Zari Border',
    care_instructions: 'Dry clean or gentle hand wash.',
    status: 'PUBLISHED',
    is_featured: 1,
    homepage_placement: 'FEATURED',
    campaign_label: 'Kids Festive',
    variants: [
      { id: 'var-chd-01', sku: 'KID-PAT-01', size: 'Age 3-5 Years', color: 'Peacock Blue & Magenta Pink', color_code: '#005F73', cost_price: 1200, selling_price: 2299, sale_price: 1899, quantity: 12, low_stock_threshold: 3 },
      { id: 'var-chd-02', sku: 'KID-PAT-02', size: 'Age 6-8 Years', color: 'Mustard Gold & Ruby Red', color_code: '#D4AF37', cost_price: 1400, selling_price: 2599, sale_price: 2199, quantity: 10, low_stock_threshold: 3 }
    ],
    media: [
      { id: 'med-chd-01', file_path: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1000&q=80', alt_text: 'Girls royal Pattu Pavadai silk lehenga', sort_order: 1, is_primary: 1 }
    ]
  },
  {
    id: 'prod-chd-boys-kurta',
    name: 'Boys Heritage Jacquard Silk Kurta Dhoti Set',
    slug: 'boys-heritage-jacquard-silk-kurta-dhoti-set',
    category_id: 'cat-children',
    description: 'Classic festive 2-piece set featuring a mandarin collar jacquard silk kurta and pre-stitched readymade silk dhoti with elasticated waistband for effortless celebration wear.',
    fabric: 'Art Silk Jacquard with Resham Detailing',
    care_instructions: 'Hand wash cold or gentle dry clean.',
    status: 'PUBLISHED',
    is_featured: 1,
    homepage_placement: 'NEW_ARRIVAL',
    campaign_label: 'New arrival',
    variants: [
      { id: 'var-chb-01', sku: 'KID-BOY-01', size: 'Age 4-6 Years', color: 'Golden Beige & Maroon', color_code: '#D4B996', cost_price: 900, selling_price: 1799, sale_price: 1499, quantity: 15, low_stock_threshold: 3 },
      { id: 'var-chb-02', sku: 'KID-BOY-02', size: 'Age 7-9 Years', color: 'Royal Blue & Antique Gold', color_code: '#102A43', cost_price: 1050, selling_price: 1999, sale_price: 1699, quantity: 12, low_stock_threshold: 3 }
    ],
    media: [
      { id: 'med-chb-01', file_path: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1000&q=80', alt_text: 'Boys heritage jacquard silk kurta dhoti set', sort_order: 1, is_primary: 1 }
    ]
  }
];

export function ensureDemoCategoryProducts() {
  const now = new Date().toISOString();
  transaction(() => {
    for (const p of demoCategoryProducts) {
      const existing = queryOne('SELECT id FROM products WHERE id = ?', [p.id]);
      if (!existing) {
        run(`INSERT INTO products (
          id, name, slug, category_id, description, fabric, care_instructions,
          status, is_featured, homepage_placement, campaign_label,
          seo_title, seo_description, canonical_url, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          p.id, p.name, p.slug, p.category_id, p.description, p.fabric, p.care_instructions,
          p.status, p.is_featured, p.homepage_placement, p.campaign_label,
          `${p.name} | India Fashions`, p.description.substring(0, 160),
          `https://indiafashions.com/product/${p.slug}`, now, now
        ]);

        for (const v of p.variants) {
          run(`INSERT OR REPLACE INTO product_variants (
            id, product_id, sku, size, color, color_code, cost_price, selling_price, sale_price, quantity, low_stock_threshold
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
            v.id, p.id, v.sku, v.size, v.color, v.color_code,
            v.cost_price, v.selling_price, v.sale_price, v.quantity, v.low_stock_threshold
          ]);
        }

        for (let i = 0; i < p.media.length; i++) {
          const m = p.media[i];
          run(`INSERT OR REPLACE INTO product_media (
            id, product_id, file_path, alt_text, sort_order, is_primary, crop_desktop, crop_mobile
          ) VALUES (?, ?, ?, ?, ?, ?, '4:5', '1:1')`, [
            m.id, p.id, m.file_path, m.alt_text, m.sort_order, m.is_primary
          ]);
        }
      }
    }
  });
  saveDb();
}

// Ensure demo products are populated on initialization
try {
  ensureDemoCategoryProducts();
} catch (e) {
  // DB may still be initializing
}

// Endpoint to force re-seed demo categories
router.post('/seed-demo-categories', (req: AuthenticatedRequest, res: Response) => {
  ensureDemoCategoryProducts();
  broadcastEvent('product_updated', { action: 'demo_seeded' });
  res.json({ success: true, message: 'Demo category products seeded successfully' });
});

export default router;
