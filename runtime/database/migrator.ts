import { getDatabase } from './client.ts';
import { AppDefinition } from '../../core/types/index.ts';
import { generateDatabaseSchema } from '../../core/generators/database.ts';
import { ensureDir } from '@std/fs';

export class DatabaseMigrator {
  private db = getDatabase();

  async ensureDatabase(): Promise<void> {
    // Ensure data directory exists
    await ensureDir('./data');
    
    // Create migrations table if it doesn't exist
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async migrate(app: AppDefinition): Promise<void> {
    await this.ensureDatabase();
    
    const migrationName = `app_${app.name}_${Date.now()}`;
    
    // Check if we need to migrate
    const existing = await this.db.execute(
      'SELECT name FROM _migrations WHERE name LIKE ? ORDER BY executed_at DESC LIMIT 1',
      [`app_${app.name}_%`]
    );

    console.log('🔄 Running database migration...');
    
    try {
      await this.db.transaction(async (tx) => {
        // Generate and execute schema
        const statements = generateDatabaseSchema(app);
        
        for (const statement of statements) {
          if (statement.trim()) {
            await tx.execute(statement);
          }
        }
        
        // Record migration
        await tx.execute(
          'INSERT INTO _migrations (name) VALUES (?)',
          [migrationName]
        );
      });
      
      console.log('✅ Database migration completed');
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    }
  }

  async reset(): Promise<void> {
    console.log('🔄 Resetting database...');
    
    // Get all user tables (exclude _migrations)
    const tables = await this.db.execute(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name NOT LIKE '_migrations'
    `);
    
    // Drop all tables
    for (const table of tables.rows) {
      await this.db.execute(`DROP TABLE IF EXISTS ${table.name}`);
    }
    
    console.log('✅ Database reset completed');
  }
}