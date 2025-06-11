import { Hono } from 'https://deno.land/x/hono@v4.3.11/mod.ts';
import { AppDefinition, EntityDefinition } from '../types/index.ts';
import { getDatabase } from '../../runtime/database/client.ts';
import { 
  ResponseBuilder, 
  DatabaseError, 
  EntityNotFoundError, 
  InvalidRequestDataError,
  PermissionError,
  FrameworkError
} from '../errors/index.ts';
import { Generator, GeneratorError } from './types.ts';

export class APIGenerator implements Generator<Hono> {
  private db = getDatabase();
  private eventEmitter: any = null; // Will be injected

  constructor(private app: AppDefinition) {}

  setEventEmitter(eventEmitter: any): void {
    this.eventEmitter = eventEmitter;
  }

  async generate(): Promise<Hono> {
    console.log(`[APIGenerator] Generating API routes for ${Object.keys(this.app.entities || {}).length} entities`);
    
    if (!this.app.entities) {
      throw new GeneratorError('APIGenerator', 'No entities defined in app');
    }
    const api = new Hono();

    // Generate routes for each entity
    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      const router = this.generateEntityRoutes(entityName, entity);
      api.route(`/${entityName.toLowerCase()}`, router);
    }

    console.log('[APIGenerator] Done');
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
        const data = this.validateAndSanitizeInput(body, entity);
        
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
        const data = this.validateAndSanitizeInput(body, entity, true);
        
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
            if (behavior.modifies) {
              const fields = Object.keys(behavior.modifies);
              const values = Object.values(behavior.modifies).map(value => 
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

  private validateAndSanitizeInput(data: any, entity: EntityDefinition, isUpdate = false): Record<string, any> {
    const sanitized: Record<string, any> = {};
    
    for (const [fieldName, field] of Object.entries(entity.fields)) {
      // Skip system fields and auto-generated fields
      if (['id', 'created_at', 'updated_at', 'createdAt', 'updatedAt'].includes(fieldName)) {
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
      
      // Only add defined values
      if (value !== undefined) {
        // Validate enum values
        if (field.type === 'enum' && field.values) {
          if (!field.values.includes(value)) {
            throw new Error(`Field '${fieldName}' must be one of: ${field.values.join(', ')}`);
          }
        }
        
        // Validate string length
        if (field.type === 'string' && typeof value === 'string') {
          if (field.maxLength && value.length > field.maxLength) {
            throw new Error(`Field '${fieldName}' exceeds maximum length of ${field.maxLength}`);
          }
        }
        
        sanitized[fieldName] = value;
      }
    }
    
    return sanitized;
  }
}