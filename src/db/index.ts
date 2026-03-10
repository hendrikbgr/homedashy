import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DB_PATH || 'sqlite.db';

// Ensure the directory exists if it's in a subdirectory
const dbDir = path.dirname(dbPath);
if (dbDir !== '.' && !fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });

// Auto-migrate on startup
try {
  // In Next.js standalone mode, we'll need to know where the migrations are
  // We'll copy them to a known location in the Dockerfile
  const migrationsPath = process.env.NODE_ENV === 'production' 
    ? path.join(process.cwd(), 'migrations') 
    : path.join(process.cwd(), 'src/db/migrations');

  if (fs.existsSync(migrationsPath)) {
    migrate(db, { migrationsFolder: migrationsPath });
    console.log('Database migrated successfully');
  } else {
    console.warn('Migration folder not found at:', migrationsPath);
  }
} catch (error) {
  console.error('Migration failed:', error);
}
