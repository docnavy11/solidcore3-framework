import { Hono } from 'https://deno.land/x/hono@v4.3.11/mod.ts';
import { AppDefinition, EntityDefinition } from '../types/index.ts';
import { 
  ResponseBuilder, 
  DatabaseError, 
  EntityNotFoundError, 
  InvalidRequestDataError,
  PermissionError,
  FrameworkError
} from '../errors/index.ts';
import { Generator, GeneratorError } from './types.ts';
import { ValidationSchemaGenerator } from '../validation/schema-generator.ts';
import { ValidationSchema } from '../validation/types.ts';

// Database interface that core expects (but doesn't implement)
interface DatabaseClient {
  execute(sql: string, params?: any[]): Promise<any>;
  transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T>;
}

export class APIGenerator implements Generator<Hono> {
  private db: DatabaseClient | null = null;
  private eventEmitter: any = null; // Will be injected
  private validationGenerator = new ValidationSchemaGenerator();

  constructor(private app: AppDefinition) {}

  setDatabase(database: DatabaseClient): void {
    this.db = database;
  }

  setEventEmitter(eventEmitter: any): void {
    this.eventEmitter = eventEmitter;
  }

  async generate(): Promise<Hono> {
    console.log(`[APIGenerator] Generating API routes for ${Object.keys(this.app.entities || {}).length} entities`);
    
    if (!this.db) {
      throw new GeneratorError('APIGenerator', 'Database not configured. Call setDatabase() before generating routes');
    }
    
    if (!this.app.entities) {
      throw new GeneratorError('APIGenerator', 'No entities defined in app');
    }
    const api = new Hono();

    // Generate routes for each entity
    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      const router = this.generateEntityRoutes(entityName, entity);
      const routePath = `/${entityName.toLowerCase()}s`;
      api.route(routePath, router);
      console.log(`[APIGenerator] Mounted ${entityName} routes at ${routePath}`);
    }

    console.log('[APIGenerator] Done - API routes generated successfully');
    return api;
  }

  private generateEntityRoutes(entityName: string, entity: EntityDefinition): Hono {
    const router = new Hono();
    const tableName = entityName.toLowerCase();

    // GET /{entity} - List all
    router.get('/', async (c) => {
      const requestId = crypto.randomUUID();
      const responseBuilder = new ResponseBuilder(requestId);
      
      try {
        const limit = parseInt(c.req.query('limit') || '50');
        const offset = parseInt(c.req.query('offset') || '0');
        
        const result = await this.db.execute(
          `SELECT * FROM ${tableName} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
          [limit, offset]
        );
        
        const response = responseBuilder.success({
          items: result.rows || [],
          pagination: { limit, offset, total: result.rows?.length || 0 }
        });
        
        return c.json(response);
      } catch (error) {
        const dbError = new DatabaseError('list', error instanceof Error ? error : undefined, undefined, tableName, requestId);
        const response = responseBuilder.error(dbError);
        return c.json(response, 500);
      }
    });

    // GET /{entity}/{id} - Get by ID
    router.get('/:id', async (c) => {
      const requestId = crypto.randomUUID();
      const responseBuilder = new ResponseBuilder(requestId);
      
      try {
        const id = c.req.param('id');
        const result = await this.db.execute(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );
        
        if (!result.rows || result.rows.length === 0) {
          const response = responseBuilder.notFound(entityName, id);
          return c.json(response, 404);
        }
        
        const response = responseBuilder.success(result.rows[0]);
        return c.json(response);
      } catch (error) {
        const dbError = new DatabaseError('get', error instanceof Error ? error : undefined, undefined, tableName, requestId);
        const response = responseBuilder.error(dbError);
        return c.json(response, 500);
      }
    });

    // POST /{entity} - Create new
    router.post('/', async (c) => {
      try {
        const body = await c.req.json();
        const data = await this.validateAndSanitizeInput(body, entity);
        
        // Add default values for fields not provided
        for (const [fieldName, field] of Object.entries(entity.fields)) {
          if (['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(fieldName)) continue;
          if (data[fieldName] === undefined && field.default !== undefined && field.default !== 'auto' && field.default !== 'now') {
            data[fieldName] = field.default;
          }
        }
        
        // Filter out undefined values
        const cleanData = Object.fromEntries(
          Object.entries(data).filter(([_, value]) => value !== undefined)
        );
        
        const fields = Object.keys(cleanData);
        const values = Object.values(cleanData);
        const placeholders = fields.map(() => '?').join(', ');
        
        console.log('Debug - Creating record:', { tableName, fields, values, cleanData });
        
        const result = await this.db.execute(
          `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
          values
        );
        
        // Return success message since we can't easily get the created record
        return c.json({ 
          message: 'Record created successfully',
          changes: result.changes 
        }, 201);
      } catch (error) {
        console.error(`Error creating ${entityName}:`, error);
        return c.json({ error: error.message || 'Failed to create record' }, 400);
      }
    });

    // PUT /{entity}/{id} - Update
    router.put('/:id', async (c) => {
      try {
        const id = c.req.param('id');
        const body = await c.req.json();
        const data = await this.validateAndSanitizeInput(body, entity, true);
        
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        
        await this.db.execute(
          `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [...values, id]
        );
        
        // Fetch the updated record
        const updated = await this.db.execute(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );
        
        if (!updated.rows || updated.rows.length === 0) {
          return c.json({ error: 'Record not found' }, 404);
        }
        
        return c.json({ data: updated.rows[0] });
      } catch (error) {
        console.error(`Error updating ${entityName}:`, error);
        return c.json({ error: error.message || 'Failed to update record' }, 400);
      }
    });

    // DELETE /{entity}/{id} - Delete
    router.delete('/:id', async (c) => {
      try {
        const id = c.req.param('id');
        
        const result = await this.db.execute(
          `DELETE FROM ${tableName} WHERE id = ?`,
          [id]
        );
        
        if (result.changes === 0) {
          return c.json({ error: 'Record not found' }, 404);
        }
        
        return c.json({ message: 'Record deleted successfully' });
      } catch (error) {
        console.error(`Error deleting ${entityName}:`, error);
        return c.json({ error: 'Failed to delete record' }, 500);
      }
    });

    // Generate behavior endpoints
    if (entity.behaviors) {
      for (const [behaviorName, behavior] of Object.entries(entity.behaviors)) {
        router.post(`/:id/${behaviorName}`, async (c) => {
          try {
            const id = c.req.param('id');
            
            // Apply modifications
            if (behavior.fields) {
              const fields = Object.keys(behavior.fields);
              const values = Object.values(behavior.fields).map(value => 
                value === 'now' ? new Date().toISOString() : value
              );
              const setClause = fields.map(field => `${field} = ?`).join(', ');
              
              await this.db.execute(
                `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [...values, id]
              );
            }
            
            // Fetch updated record
            const updated = await this.db.execute(
              `SELECT * FROM ${tableName} WHERE id = ?`,
              [id]
            );
            
            // Emit events for workflows
            if (behavior.emits && this.eventEmitter) {
              const events = Array.isArray(behavior.emits) ? behavior.emits : [behavior.emits];
              for (const event of events) {
                await this.eventEmitter.emit(event, {
                  entity: entityName,
                  entityId: id,
                  behavior: behaviorName,
                  data: updated.rows?.[0] || {},
                  timestamp: new Date().toISOString()
                });
              }
            }
            
            return c.json({ 
              data: updated.rows?.[0],
              behavior: behaviorName,
              message: `${behaviorName} executed successfully`
            });
          } catch (error) {
            console.error(`Error executing behavior ${behaviorName}:`, error);
            return c.json({ error: 'Failed to execute behavior' }, 500);
          }
        });
      }
    }

    return router;
  }

  private async validateAndSanitizeInput(data: any, entity: EntityDefinition, isUpdate = false): Promise<Record<string, any>> {
    // Generate validation schema for this entity
    const validationSchema = this.validationGenerator.generateEntitySchema(entity);
    
    // Create validator instance
    const validator = await import('../../runtime/validation/validator.ts').then(m => new m.RuntimeDataValidator(this.db));
    
    // If it's an update, make all fields optional (except those explicitly required for updates)
    if (isUpdate) {
      for (const fieldName in validationSchema.fields) {
        if (!['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(fieldName)) {
          validationSchema.fields[fieldName].required = false;
        }
      }
    }
    
    // Validate the data
    const result = await validator.validate(data, validationSchema);
    
    if (!result.isValid) {
      const errorMessages = result.errors.map(err => `${err.field}: ${err.message}`).join(', ');
      throw new InvalidRequestDataError(`Validation failed: ${errorMessages}`, { errors: result.errors });
    }
    
    const sanitized: Record<string, any> = result.sanitizedData || {};
    
    // Filter out system fields and auto-generated fields
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      // Skip system fields and auto-generated fields
      if (['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(fieldName)) {
        delete sanitized[fieldName];
        continue;
      }
      
      // Skip fields with default values that auto-generate
      if (field.default === 'auto' || field.default === 'now') {
        continue;
      }
      
      const value = data[fieldName];
      
      // Check required fields (only for create), but allow default values
      if (!isUpdate && field.required && (value === undefined || value === null) && field.default === undefined) {
        throw new Error(`Field '${fieldName}' is required`);
      }
      
      // Skip undefined values in updates
      if (isUpdate && value === undefined) {
        continue;
      }
      
      // Only add defined values (validation already handled by validator)
      if (value !== undefined) {
        sanitized[fieldName] = value;
      }
    }
    
    return sanitized;
  }
}