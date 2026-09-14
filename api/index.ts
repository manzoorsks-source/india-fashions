import app from '../server/index.js';
import { getDb } from '../server/db/database.js';

let isDbReady = false;

export default async function handler(req: any, res: any) {
  if (!isDbReady) {
    try {
      await getDb();
      isDbReady = true;
    } catch (err) {
      console.error('Database initialization error in Vercel function:', err);
    }
  }
  return app(req, res);
}
