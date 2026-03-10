import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

// Get database path from environment or default
const dbPath = process.env.DB_PATH || 'sqlite.db';
const absoluteDbPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

console.log(`[DB] Initializing database at: ${absoluteDbPath}`);

// Ensure the directory exists
const dbDir = path.dirname(absoluteDbPath);
try {
  if (!fs.existsSync(dbDir)) {
    console.log(`[DB] Creating directory: ${dbDir}`);
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  // Check if directory is writable
  fs.accessSync(dbDir, fs.constants.W_OK);
  console.log(`[DB] Directory is writable`);
} catch (err) {
  console.error(`[DB] Directory error:`, err);
}

// Initialize SQLite database
let sqlite;
try {
  sqlite = new Database(absoluteDbPath);
  // Important for SQLite performance and concurrent access
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('synchronous = NORMAL');
} catch (err) {
  console.error(`[DB] Failed to open database:`, err);
  throw err;
}

export const db = drizzle(sqlite, { schema });

// Auto-migrate on startup
try {
  const migrationsPath = process.env.NODE_ENV === 'production' 
    ? path.join(process.cwd(), 'migrations') 
    : path.join(process.cwd(), 'src/db/migrations');

  console.log(`[DB] Looking for migrations at: ${migrationsPath}`);

  if (fs.existsSync(migrationsPath)) {
    migrate(db, { migrationsFolder: migrationsPath });
    console.log('[DB] Database migrated successfully');
  } else {
    console.warn('[DB] Migration folder not found at:', migrationsPath);
  }
} catch (error) {
  console.error('[DB] Migration failed:', error);
}
