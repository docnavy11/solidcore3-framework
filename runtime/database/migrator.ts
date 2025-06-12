import { getDatabase } from './client.ts';
import { AppDefinition } from '../../core/types/index.ts';
import { generateDatabaseSchema } from '../../core/generators/database.ts';
import { ensureDir } from '@std/fs';
import { DatabaseError } from '../../core/errors/index.ts';

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
    
    console.log('🔄 Running database migration...');
    
    try {
      await this.db.transaction(async (tx) => {
        // First, run basic schema creation (for new tables)
        const statements = generateDatabaseSchema(app);
        
        for (const statement of statements) {
          if (statement.trim()) {
            try {
              await tx.execute(statement);
            } catch (error) {
              // Check if this is an expected error (already exists)
              if (error.message && error.message.includes('already exists')) {
                // This is fine - table/index/trigger already exists
                const match = statement.match(/CREATE\s+(?:TABLE|INDEX|TRIGGER)\s+(?:IF\s+NOT\s+EXISTS\s+)?(\S+)/i);
                const objectName = match ? match[1] : 'object';
                console.log(`ℹ️  ${objectName} already exists - skipping`);
              } else {
                // This is an unexpected error that should stop migration
                console.error('❌ Schema statement failed:', error.message);
                throw new DatabaseError(
                  'Migration failed during schema creation',
                  { cause: error, statement }
                );
              }
            }
          }
        }
        
        // Then, handle schema evolution (add missing columns)
        await this.handleSchemaEvolution(tx, app);
        
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

  private async handleSchemaEvolution(tx: any, app: AppDefinition): Promise<void> {
    console.log('🔧 Checking for schema evolution...');
    
    for (const [entityName, entity] of Object.entries(app.entities)) {
      const tableName = entityName.toLowerCase();
      
      // Check if table exists first
      const tableExists = await tx.execute(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name=?
      `, [tableName]);
      
      if (!tableExists.rows || tableExists.rows.length === 0) {
        console.log(`⚠️  Table '${tableName}' doesn't exist yet, skipping schema evolution`);
        continue;
      }
      
      console.log(`🔍 Checking columns for existing table '${tableName}'`);
      
      // Get existing columns for this table
      const existingColumns = await tx.execute(`PRAGMA table_info(${tableName})`);
      
      // Debug: log what we get back
      if (!existingColumns.rows || existingColumns.rows.length === 0) {
        console.log(`⚠️  Could not retrieve column info for '${tableName}' - checking columns individually`);
        // Fall back to the try-catch approach but with better error handling
        for (const [fieldName, field] of Object.entries(entity.fields)) {
          // Skip system fields that are already handled in table creation
          if (['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(fieldName)) {
            continue;
          }
          
          const columnDef = this.generateColumnDefinition(fieldName, field);
          
          try {
            await tx.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
            console.log(`✅ Added column '${fieldName}' to '${tableName}'`);
          } catch (error) {
            if (error.message && error.message.includes('duplicate column name')) {
              console.log(`ℹ️  Column '${fieldName}' already exists in '${tableName}'`);
            } else {
              console.error(`❌ Failed to add column '${fieldName}' to '${tableName}':`, error.message);
              throw new DatabaseError(
                `Migration failed: Could not add column '${fieldName}' to '${tableName}'`,
                { cause: error, field: fieldName, table: tableName }
              );
            }
          }
        }
        continue;
      }
      
      const columnNames = new Set((existingColumns.rows || []).map((col: any) => col.name));
      
      // Add missing columns
      for (const [fieldName, field] of Object.entries(entity.fields)) {
        // Skip system fields that are already handled in table creation
        if (['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(fieldName)) {
          continue;
        }
        
        // Check if column already exists
        if (columnNames.has(fieldName)) {
          console.log(`ℹ️  Column '${fieldName}' already exists in '${tableName}'`);
          continue;
        }
        
        const columnDef = this.generateColumnDefinition(fieldName, field);
        
        try {
          await tx.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnDef}`);
          console.log(`✅ Added column '${fieldName}' to '${tableName}'`);
        } catch (error) {
          // Any error at this point is unexpected since we checked existence
          console.error(`❌ Failed to add column '${fieldName}' to '${tableName}':`, error.message);
          throw new DatabaseError(
            `Migration failed: Could not add column '${fieldName}' to '${tableName}'`,
            { cause: error, field: fieldName, table: tableName }
          );
        }
      }
    }
  }

  private generateColumnDefinition(fieldName: string, field: any): string {
    let column = `${fieldName} ${this.getSQLType(field)}`;
    
    if (field.required && field.default !== undefined) {
      column += ' NOT NULL';
    }
    
    if (field.unique) {
      column += ' UNIQUE';
    }
    
    if (field.default !== undefined) {
      column += ` DEFAULT ${this.formatDefaultValue(field.default, field.type)}`;
    }
    
    return column;
  }

  private getSQLType(field: any): string {
    switch (field.type) {
      case 'string':
      case 'text':
      case 'uuid':
      case 'enum':
        return 'TEXT';
      case 'number':
        return 'REAL';
      case 'integer':
        return 'INTEGER';
      case 'boolean':
        return 'INTEGER'; // SQLite doesn't have native boolean
      case 'date':
      case 'datetime':
        return 'DATETIME';
      case 'json':
        return 'TEXT'; // Store JSON as text
      case 'reference':
      case 'relation':
        return 'TEXT'; // Foreign key as text
      default:
        return 'TEXT';
    }
  }

  private formatDefaultValue(value: any, type: string): string {
    if (value === 'now' || value === 'CURRENT_TIMESTAMP') {
      return 'CURRENT_TIMESTAMP';
    }
    
    if (value === 'auto' && type === 'uuid') {
      return '(hex(randomblob(16)))';
    }
    
    if (typeof value === 'string') {
      return `'${value}'`;
    }
    
    if (typeof value === 'boolean') {
      return value ? '1' : '0';
    }
    
    if (value === null || value === undefined) {
      return 'NULL';
    }
    
    return String(value);
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