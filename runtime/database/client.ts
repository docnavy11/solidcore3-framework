import { Database } from '@sqlite';
import { DatabaseError, DatabaseConnectionError } from '../../core/errors/index.ts';

export interface DatabaseClient {
  execute(sql: string, params?: any[]): Promise<any>;
  transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T>;
  close(): void;
}

class SQLiteClient implements DatabaseClient {
  private db: Database;

  constructor(path: string) {
    this.db = new Database(path);
  }

  async execute(sql: string, params: any[] = []): Promise<any> {
    try {
      if (sql.trim().toUpperCase().startsWith('SELECT')) {
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(params);
        stmt.finalize();
        return { rows };
      } else {
        const stmt = this.db.prepare(sql);
        const result = stmt.run(params);
        stmt.finalize();
        return { 
          changes: result.changes,
          lastInsertRowId: result.lastInsertRowid
        };
      }
    } catch (error) {
      console.error('Database query error:', error);
      throw error;
    }
  }

  async transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T> {
    this.db.exec('BEGIN TRANSACTION');
    try {
      const result = await fn(this);
      this.db.exec('COMMIT');
      return result;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  close(): void {
    this.db.close();
  }
}

// Singleton instance
let dbInstance: DatabaseClient | null = null;

export function createDatabaseClient(): DatabaseClient {
  const dbPath = Deno.env.get('DATABASE_PATH') || './data/app.db';
  return new SQLiteClient(dbPath);
}

export function getDatabase(): DatabaseClient {
  if (!dbInstance) {
    dbInstance = createDatabaseClient();
  }
  return dbInstance;
}