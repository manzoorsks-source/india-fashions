import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb } from './db/database.js';
import { seed } from './db/seed.js';
import { authMiddleware } from './middleware/auth.js';

import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import inventoryRoutes from './routes/inventory.js';
import mediaRoutes from './routes/media.js';
import salesRoutes from './routes/sales.js';
import orderRoutes from './routes/orders.js';
import advanceOrderRoutes from './routes/advanceOrders.js';
import settingsRoutes from './routes/settings.js';
import tickerRoutes from './routes/ticker.js';
import deliveryRoutes from './routes/delivery.js';
import eventsRoutes from './routes/events.js';
import openapiRoutes from './routes/openapi.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Static uploads folder
const uploadsDir = path.resolve(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsDir));

// Auth resolution middleware
app.use(authMiddleware);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/advance-orders', advanceOrderRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/ticker', tickerRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/openapi.json', openapiRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', brand: 'India Fashions', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// Initialize database and start listening
async function start() {
  await getDb();
  console.log('Database initialized successfully.');

  app.listen(PORT, () => {
    console.log(`India Fashions Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Server startup failed:', err);
  process.exit(1);
});
