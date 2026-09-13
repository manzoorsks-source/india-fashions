import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { query, queryOne, run, transaction } from '../db/database.js';
import { AuthenticatedRequest, requireRole } from '../middleware/auth.js';
import { recordAudit } from '../middleware/audit.js';
import { broadcastEvent } from './events.js';
import { ProductMedia } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '-');
    cb(null, `${base}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

const router = Router();

// GET media for a product
router.get('/product/:productId', (req: AuthenticatedRequest, res: Response) => {
  const { productId } = req.params;
  const media = query<ProductMedia>(
    'SELECT * FROM product_media WHERE product_id = ? ORDER BY sort_order ASC',
    [productId]
  );
  res.json({ media });
});

// Upload media files for product
router.post('/upload', requireRole(['SUPER_ADMIN', 'ADMIN']), upload.array('photos', 10), (req: AuthenticatedRequest, res: Response) => {
  const files = req.files as Express.Multer.File[];
  const { product_id, alt_text } = req.body;

  if (!product_id) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'At least one photo file is required' });
  }

  const existingCount = queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM product_media WHERE product_id = ?',
    [product_id]
  )?.count || 0;

  const inserted: ProductMedia[] = [];

  transaction(() => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const mediaId = 'med-' + Date.now().toString(36) + '-' + i;
      const filePath = `/uploads/${file.filename}`;
      const sortOrder = existingCount + i + 1;
      const isPrimary = (existingCount === 0 && i === 0) ? 1 : 0;

      run(`INSERT INTO product_media (
        id, product_id, file_path, alt_text, sort_order, is_primary, crop_desktop, crop_mobile
      ) VALUES (?, ?, ?, ?, ?, ?, '4:5', '1:1')`, [
        mediaId, product_id, filePath, alt_text || 'Saree product image', sortOrder, isPrimary
      ]);

      inserted.push({
        id: mediaId,
        product_id,
        file_path: filePath,
        alt_text: alt_text || 'Saree product image',
        sort_order: sortOrder,
        is_primary: Boolean(isPrimary),
        crop_desktop: '4:5',
        crop_mobile: '1:1'
      });
    }
  });

  recordAudit(req, 'MEDIA', product_id, 'UPLOAD_PHOTOS', null, { uploaded_count: files.length });
  broadcastEvent('product_updated', { id: product_id, action: 'media_uploaded' });

  res.status(201).json({ success: true, media: inserted });
});

// Set Primary Photo
router.post('/:id/set-primary', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const media = queryOne<ProductMedia>('SELECT * FROM product_media WHERE id = ?', [id]);
  if (!media) return res.status(404).json({ error: 'Media not found' });

  transaction(() => {
    // Unset all other photos for this product
    run('UPDATE product_media SET is_primary = 0 WHERE product_id = ?', [media.product_id]);
    // Set this one
    run('UPDATE product_media SET is_primary = 1 WHERE id = ?', [id]);
  });

  recordAudit(req, 'MEDIA', id, 'SET_PRIMARY_MEDIA', null, { media_id: id, product_id: media.product_id });
  broadcastEvent('product_updated', { id: media.product_id, action: 'primary_media_changed' });

  res.json({ success: true });
});

// Update Media Metadata (alt text, crop metadata, sort order)
router.put('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { alt_text, crop_desktop, crop_mobile, sort_order } = req.body;

  const prev = queryOne<ProductMedia>('SELECT * FROM product_media WHERE id = ?', [id]);
  if (!prev) return res.status(404).json({ error: 'Media not found' });

  run(`UPDATE product_media SET
    alt_text = ?, crop_desktop = ?, crop_mobile = ?, sort_order = ?
    WHERE id = ?`, [
    alt_text ?? prev.alt_text,
    crop_desktop ?? prev.crop_desktop,
    crop_mobile ?? prev.crop_mobile,
    sort_order ?? prev.sort_order,
    id
  ]);

  recordAudit(req, 'MEDIA', id, 'UPDATE_MEDIA_META', prev, req.body);
  broadcastEvent('product_updated', { id: prev.product_id, action: 'media_meta_updated' });

  res.json({ success: true });
});

// Reorder gallery items
router.post('/reorder', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { items } = req.body; // Array of { id: string, sort_order: number }
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Items array is required' });

  transaction(() => {
    for (const item of items) {
      run('UPDATE product_media SET sort_order = ? WHERE id = ?', [item.sort_order, item.id]);
    }
  });

  res.json({ success: true });
});

// Delete Media
router.delete('/:id', requireRole(['SUPER_ADMIN', 'ADMIN']), (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const media = queryOne<ProductMedia>('SELECT * FROM product_media WHERE id = ?', [id]);
  if (!media) return res.status(404).json({ error: 'Media not found' });

  run('DELETE FROM product_media WHERE id = ?', [id]);

  // If was primary, promote next available
  if (media.is_primary) {
    const next = queryOne<ProductMedia>('SELECT id FROM product_media WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1', [media.product_id]);
    if (next) {
      run('UPDATE product_media SET is_primary = 1 WHERE id = ?', [next.id]);
    }
  }

  recordAudit(req, 'MEDIA', id, 'DELETE_MEDIA', media, null);
  broadcastEvent('product_updated', { id: media.product_id, action: 'media_deleted' });

  res.json({ success: true });
});

export default router;
