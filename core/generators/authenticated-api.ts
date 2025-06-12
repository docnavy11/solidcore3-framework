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
import AuthMiddleware, { AuthContext } from '../../runtime/auth/middleware.ts';
import PermissionEvaluator from '../../runtime/auth/permission-evaluator.ts';

// Database interface that core expects (but doesn't implement)
interface DatabaseClient {
  execute(sql: string, params?: any[]): Promise<any>;
  transaction<T>(fn: (tx: DatabaseClient) => Promise<T>): Promise<T>;
}

export class AuthenticatedAPIGenerator implements Generator<Hono> {
  private db: DatabaseClient | null = null;
  private eventEmitter: any = null; // Will be injected
  private validationGenerator = new ValidationSchemaGenerator();
  private authMiddleware: AuthMiddleware;
  private permissionEvaluator: PermissionEvaluator;

  constructor(private app: AppDefinition) {
    this.authMiddleware = new AuthMiddleware();
    this.permissionEvaluator = new PermissionEvaluator();
  }

  setDatabase(database: DatabaseClient): void {
    this.db = database;
  }

  setEventEmitter(eventEmitter: any): void {
    this.eventEmitter = eventEmitter;
  }

  async generate(): Promise<Hono> {
    console.log(`[AuthenticatedAPIGenerator] Generating API routes for ${Object.keys(this.app.entities || {}).length} entities`);
    
    if (!this.db) {
      throw new GeneratorError('AuthenticatedAPIGenerator', 'Database not configured. Call setDatabase() before generating routes');
    }
    
    if (!this.app.entities) {
      throw new GeneratorError('AuthenticatedAPIGenerator', 'No entities defined in app');
    }
    
    const api = new Hono();

    // Add authentication middleware to all routes
    api.use('*', this.authMiddleware.authenticate());

    // Generate routes for each entity
    for (const [entityName, entity] of Object.entries(this.app.entities)) {
      const router = this.generateEntityRoutes(entityName, entity);
      const routePath = `/${entityName.toLowerCase()}s`;
      api.route(routePath, router);
      console.log(`[AuthenticatedAPIGenerator] Mounted ${entityName} routes at ${routePath}`);
    }

    console.log('[AuthenticatedAPIGenerator] Done - API routes generated successfully');
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
        // Check read permission
        if (!this.checkPermission(c, entity, null, 'read')) {
          const response = responseBuilder.error(new PermissionError('read', entityName));
          return c.json(response, 403);
        }

        const limit = parseInt(c.req.query('limit') || '50');
        const offset = parseInt(c.req.query('offset') || '0');
        
        // Add filtering based on user permissions if needed
        let query = `SELECT * FROM ${tableName}`;
        const params: any[] = [];
        
        // If user is not admin, they might only see their own records
        const auth = AuthMiddleware.getAuthContext(c);
        if (auth.authenticated && auth.user?.role !== 'admin' && this.hasOwnershipField(entity)) {
          query += ` WHERE created_by = ?`;
          params.push(auth.user.id);
        }
        
        query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
        params.push(limit, offset);
        
        const result = await this.db!.execute(query, params);
        
        // Filter results based on individual permissions
        const filteredItems = (result.rows || []).filter((item: any) => 
          this.checkPermission(c, entity, item, 'read')
        );
        
        const response = responseBuilder.success({
          items: filteredItems,
          pagination: { limit, offset, total: filteredItems.length }
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
        const result = await this.db!.execute(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );
        
        if (!result.rows || result.rows.length === 0) {
          const response = responseBuilder.notFound(entityName, id);
          return c.json(response, 404);
        }

        const item = result.rows[0];
        
        // Check read permission for this specific item
        if (!this.checkPermission(c, entity, item, 'read')) {
          const response = responseBuilder.error(new PermissionError('read', entityName));
          return c.json(response, 403);
        }
        
        const response = responseBuilder.success(item);
        return c.json(response);
      } catch (error) {
        const dbError = new DatabaseError('get', error instanceof Error ? error : undefined, undefined, tableName, requestId);
        const response = responseBuilder.error(dbError);
        return c.json(response, 500);
      }
    });

    // POST /{entity} - Create new
    router.post('/', async (c) => {
      const requestId = crypto.randomUUID();
      const responseBuilder = new ResponseBuilder(requestId);
      
      try {
        // Check create permission
        if (!this.checkPermission(c, entity, null, 'create')) {
          const response = responseBuilder.error(new PermissionError('create', entityName));
          return c.json(response, 403);
        }

        const body = await c.req.json();
        const data = await this.validateAndSanitizeInput(body, entity);
        
        // Automatically set createdBy field if user is authenticated
        const auth = AuthMiddleware.getAuthContext(c);
        if (auth.authenticated && auth.user && this.hasOwnershipField(entity)) {
          data.createdBy = auth.user.id;
        }
        
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
        
        const result = await this.db!.execute(
          `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`,
          values
        );
        
        // Return success message since we can't easily get the created record
        const response = responseBuilder.success({ 
          message: 'Record created successfully',
          changes: result.changes 
        });
        return c.json(response, 201);
      } catch (error) {
        console.error(`Error creating ${entityName}:`, error);
        const response = responseBuilder.error(
          new InvalidRequestDataError(error.message || 'Failed to create record')
        );
        return c.json(response, 400);
      }
    });

    // PUT /{entity}/{id} - Update
    router.put('/:id', async (c) => {
      const requestId = crypto.randomUUID();
      const responseBuilder = new ResponseBuilder(requestId);
      
      try {
        const id = c.req.param('id');
        
        // First, get the existing record to check permissions
        const existingResult = await this.db!.execute(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );
        
        if (!existingResult.rows || existingResult.rows.length === 0) {
          const response = responseBuilder.notFound(entityName, id);
          return c.json(response, 404);
        }

        const existingItem = existingResult.rows[0];
        
        // Check update permission for this specific item
        if (!this.checkPermission(c, entity, existingItem, 'update')) {
          const response = responseBuilder.error(new PermissionError('update', entityName));
          return c.json(response, 403);
        }

        const body = await c.req.json();
        const data = await this.validateAndSanitizeInput(body, entity, true);
        
        const fields = Object.keys(data);
        const values = Object.values(data);
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        
        await this.db!.execute(
          `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
          [...values, id]
        );
        
        // Fetch the updated record
        const updated = await this.db!.execute(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );
        
        if (!updated.rows || updated.rows.length === 0) {
          const response = responseBuilder.notFound(entityName, id);
          return c.json(response, 404);
        }
        
        const response = responseBuilder.success({ data: updated.rows[0] });
        return c.json(response);
      } catch (error) {
        console.error(`Error updating ${entityName}:`, error);
        const response = responseBuilder.error(
          new InvalidRequestDataError(error.message || 'Failed to update record')
        );
        return c.json(response, 400);
      }
    });

    // DELETE /{entity}/{id} - Delete
    router.delete('/:id', async (c) => {
      const requestId = crypto.randomUUID();
      const responseBuilder = new ResponseBuilder(requestId);
      
      try {
        const id = c.req.param('id');
        
        // First, get the existing record to check permissions
        const existingResult = await this.db!.execute(
          `SELECT * FROM ${tableName} WHERE id = ?`,
          [id]
        );
        
        if (!existingResult.rows || existingResult.rows.length === 0) {
          const response = responseBuilder.notFound(entityName, id);
          return c.json(response, 404);
        }

        const existingItem = existingResult.rows[0];
        
        // Check delete permission for this specific item
        if (!this.checkPermission(c, entity, existingItem, 'delete')) {
          const response = responseBuilder.error(new PermissionError('delete', entityName));
          return c.json(response, 403);
        }
        
        const result = await this.db!.execute(
          `DELETE FROM ${tableName} WHERE id = ?`,
          [id]
        );
        
        if (result.changes === 0) {
          const response = responseBuilder.notFound(entityName, id);
          return c.json(response, 404);
        }
        
        const response = responseBuilder.success({ message: 'Record deleted successfully' });
        return c.json(response);
      } catch (error) {
        console.error(`Error deleting ${entityName}:`, error);
        const response = responseBuilder.error(
          new DatabaseError('delete', error instanceof Error ? error : undefined, undefined, tableName, requestId)
        );
        return c.json(response, 500);
      }
    });

    // Generate behavior endpoints
    if (entity.behaviors) {
      for (const [behaviorName, behavior] of Object.entries(entity.behaviors)) {
        router.post(`/:id/${behaviorName}`, async (c) => {
          const requestId = crypto.randomUUID();
          const responseBuilder = new ResponseBuilder(requestId);
          
          try {
            const id = c.req.param('id');
            
            // First, get the existing record to check permissions
            const existingResult = await this.db!.execute(
              `SELECT * FROM ${tableName} WHERE id = ?`,
              [id]
            );
            
            if (!existingResult.rows || existingResult.rows.length === 0) {
              const response = responseBuilder.notFound(entityName, id);
              return c.json(response, 404);
            }

            const existingItem = existingResult.rows[0];
            
            // Check if user can update this entity (behaviors typically require update permission)
            if (!this.checkPermission(c, entity, existingItem, 'update')) {
              const response = responseBuilder.error(new PermissionError('update', entityName));
              return c.json(response, 403);
            }
            
            // Apply modifications
            if (behavior.fields) {
              const fields = Object.keys(behavior.fields);
              const values = Object.values(behavior.fields).map(value => 
                value === 'now' ? new Date().toISOString() : value
              );
              const setClause = fields.map(field => `${field} = ?`).join(', ');
              
              await this.db!.execute(
                `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                [...values, id]
              );
            }
            
            // Fetch updated record
            const updated = await this.db!.execute(
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
                  timestamp: new Date().toISOString(),
                  user: AuthMiddleware.getCurrentUser(c)
                });
              }
            }
            
            const response = responseBuilder.success({ 
              data: updated.rows?.[0],
              behavior: behaviorName,
              message: `${behaviorName} executed successfully`
            });
            return c.json(response);
          } catch (error) {
            console.error(`Error executing behavior ${behaviorName}:`, error);
            const response = responseBuilder.error(
              new DatabaseError('behavior', error instanceof Error ? error : undefined, undefined, tableName, requestId)
            );
            return c.json(response, 500);
          }
        });
      }
    }

    return router;
  }

  /**
   * Check if user has permission for an action on an entity
   */
  private checkPermission(
    c: any, 
    entity: EntityDefinition, 
    item: any, 
    action: string
  ): boolean {
    // If no permissions defined, default to allow (for backward compatibility)
    if (!entity.permissions) {
      return true;
    }

    const permission = entity.permissions[action as keyof typeof entity.permissions];
    if (!permission) {
      return true; // No permission rule means allow
    }

    const auth = AuthMiddleware.getAuthContext(c);
    const context = PermissionEvaluator.createContext(auth, item, action);
    
    return this.permissionEvaluator.evaluate(permission, context);
  }

  /**
   * Check if entity has ownership field (createdBy)
   */
  private hasOwnershipField(entity: EntityDefinition): boolean {
    return 'createdBy' in entity.fields;
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

export { AuthenticatedAPIGenerator as default };