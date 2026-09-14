import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getDbPath(): string {
  if (process.env.VERCEL) {
    const tmpPath = path.resolve('/tmp', 'india_fashions.sqlite');
    const sourceCandidates = [
      path.resolve(process.cwd(), 'data/india_fashions.sqlite'),
      path.resolve(__dirname, '../../data/india_fashions.sqlite')
    ];
    if (!fs.existsSync(tmpPath)) {
      for (const src of sourceCandidates) {
        if (fs.existsSync(src)) {
          try {
            fs.copyFileSync(src, tmpPath);
            break;
          } catch (e) {
            console.warn('Could not copy sqlite to /tmp:', e);
          }
        }
      }
    }
    return tmpPath;
  }
  return path.resolve(__dirname, '../../data/india_fashions.sqlite');
}

function getSchemaPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'server/db/schema.sql'),
    path.resolve(__dirname, 'schema.sql'),
    path.resolve(__dirname, '../server/db/schema.sql')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve(__dirname, 'schema.sql');
}

let DB_PATH = getDbPath();
let SCHEMA_PATH = getSchemaPath();

let dbInstance: SqlJsDatabase | null = null;

export async function getDb(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance;

  DB_PATH = getDbPath();
  SCHEMA_PATH = getSchemaPath();

  const locateFile = (file: string) => {
    const candidates = [
      path.resolve(process.cwd(), 'node_modules/sql.js/dist', file),
      path.resolve(__dirname, '../../node_modules/sql.js/dist', file),
      path.resolve('/var/task/node_modules/sql.js/dist', file)
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return file;
  };

  const SQL = await initSqlJs({ locateFile });
  const dbDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dbDir)) {
    try {
      fs.mkdirSync(dbDir, { recursive: true });
    } catch (e) {
      console.warn('Failed to create dbDir:', e);
    }
  }

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (err) {
      console.warn('Error reading existing sqlite file, creating fresh DB:', err);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  // Run schema migration if schema file exists
  if (fs.existsSync(SCHEMA_PATH)) {
    try {
      const schemaSql = fs.readFileSync(SCHEMA_PATH, 'utf-8');
      dbInstance.run(schemaSql);
      saveDb();
    } catch (err) {
      console.warn('Error applying schema migration:', err);
    }
  }

  // If running on Vercel or freshly created, verify tables exist
  try {
    const countCheck = queryOne<{ count: number }>("SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name='categories';");
    if (!countCheck || countCheck.count === 0) {
      const { seed } = await import('./seed.js');
      await seed();
    }
  } catch (err) {
    // If table doesn't exist yet, seed it
    try {
      const { seed } = await import('./seed.js');
      await seed();
    } catch (seedErr) {
      console.warn('Auto-seed check failed:', seedErr);
    }
  }

  return dbInstance;
}

export function saveDb() {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Failed to save SQLite DB to disk:', err);
  }
}

export function query<T = any>(sql: string, params: any[] = []): T[] {
  if (!dbInstance) throw new Error('Database not initialized. Call getDb() first.');
  const stmt = dbInstance.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | null {
  const res = query<T>(sql, params);
  return res.length > 0 ? res[0] : null;
}

export function run(sql: string, params: any[] = []): { changes: number } {
  if (!dbInstance) throw new Error('Database not initialized. Call getDb() first.');
  dbInstance.run(sql, params);
  const changes = dbInstance.getRowsModified();
  if (!inTransaction) {
    saveDb();
  }
  return { changes };
}

let inTransaction = false;

export function transaction<T>(callback: () => T): T {
  if (!dbInstance) throw new Error('Database not initialized. Call getDb() first.');
  if (inTransaction) {
    return callback();
  }

  inTransaction = true;
  dbInstance.run('BEGIN TRANSACTION;');
  try {
    const result = callback();
    dbInstance.run('COMMIT;');
    saveDb();
    return result;
  } catch (err) {
    console.error('Inner transaction error:', err);
    try {
      dbInstance.run('ROLLBACK;');
    } catch (rollbackErr) {
      // ignore rollback err if no transaction
    }
    throw err;
  } finally {
    inTransaction = false;
  }
}

