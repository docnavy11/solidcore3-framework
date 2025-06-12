import { SafeExpressionParser } from '../../core/expression/parser.ts';
import { AuthUser, AuthContext } from './middleware.ts';

export interface PermissionContext {
  user?: AuthUser;
  entity?: Record<string, any>;
  action: string;
  authenticated: boolean;
}

export class PermissionEvaluator {
  private expressionParser: SafeExpressionParser;

  constructor() {
    this.expressionParser = new SafeExpressionParser();
  }

  /**
   * Evaluate a permission expression
   */
  evaluate(expression: string, context: PermissionContext): boolean {
    try {
      // Build the evaluation context for the expression parser
      const evalContext = this.buildEvaluationContext(context);
      
      // Use the existing expression parser to evaluate the permission
      const result = this.expressionParser.evaluate(expression, evalContext);
      
      if (!result.success) {
        console.warn(`Permission evaluation failed: ${result.error}`);
        return false; // Default to deny if evaluation fails
      }
      
      return !!result.value;
    } catch (error) {
      console.error('Permission evaluation error:', error);
      return false; // Default to deny on error
    }
  }

  /**
   * Build the context object for expression evaluation
   */
  private buildEvaluationContext(context: PermissionContext): Record<string, any> {
    const evalContext: Record<string, any> = {
      // Authentication status
      authenticated: context.authenticated,
      
      // Current action being performed
      action: context.action,
    };

    // Add user information if authenticated
    if (context.user) {
      evalContext.user = {
        id: context.user.id,
        email: context.user.email,
        name: context.user.name,
        role: context.user.role,
        isActive: context.user.isActive,
      };
    } else {
      evalContext.user = null;
    }

    // Add entity information if provided
    if (context.entity) {
      evalContext.entity = context.entity;
      
      // Add common entity relationship shortcuts
      if (context.entity.createdBy) {
        evalContext.owner = context.entity.createdBy;
        evalContext.isOwner = context.user?.id === context.entity.createdBy;
      }
      
      if (context.entity.userId) {
        evalContext.entityUser = context.entity.userId;
        evalContext.isEntityUser = context.user?.id === context.entity.userId;
      }
      
      if (context.entity.assignedTo) {
        evalContext.assignedTo = context.entity.assignedTo;
        evalContext.isAssignee = context.user?.id === context.entity.assignedTo;
      }
    } else {
      evalContext.entity = null;
      evalContext.owner = null;
      evalContext.isOwner = false;
      evalContext.entityUser = null;
      evalContext.isEntityUser = false;
      evalContext.assignedTo = null;
      evalContext.isAssignee = false;
    }

    return evalContext;
  }

  /**
   * Evaluate multiple permissions and return the results
   */
  evaluateMultiple(
    permissions: Record<string, string>, 
    context: PermissionContext
  ): Record<string, boolean> {
    const results: Record<string, boolean> = {};
    
    for (const [action, expression] of Object.entries(permissions)) {
      results[action] = this.evaluate(expression, {
        ...context,
        action,
      });
    }
    
    return results;
  }

  /**
   * Check if user has permission for a specific action on an entity
   */
  hasPermission(
    expression: string,
    user: AuthUser | null,
    entity: Record<string, any> | null,
    action: string
  ): boolean {
    return this.evaluate(expression, {
      user: user || undefined,
      entity: entity || undefined,
      action,
      authenticated: !!user,
    });
  }

  /**
   * Get allowed actions for a user on an entity
   */
  getAllowedActions(
    permissions: Record<string, string>,
    user: AuthUser | null,
    entity: Record<string, any> | null
  ): string[] {
    const allowedActions: string[] = [];
    
    for (const [action, expression] of Object.entries(permissions)) {
      if (this.hasPermission(expression, user, entity, action)) {
        allowedActions.push(action);
      }
    }
    
    return allowedActions;
  }

  /**
   * Create a permission context from auth context
   */
  static createContext(
    authContext: AuthContext,
    entity: Record<string, any> | null,
    action: string
  ): PermissionContext {
    return {
      user: authContext.user,
      entity: entity || undefined,
      action,
      authenticated: authContext.authenticated,
    };
  }

  /**
   * Common permission patterns as helper methods
   */
  static patterns = {
    // Anyone can access
    public: 'true',
    
    // Must be authenticated
    authenticated: 'authenticated',
    
    // Admin only
    adminOnly: 'user.role == "admin"',
    
    // Admin or manager
    adminOrManager: 'user.role == "admin" || user.role == "manager"',
    
    // Owner only (for entities with createdBy field)
    ownerOnly: 'user.id == entity.createdBy',
    
    // Admin or owner
    adminOrOwner: 'user.role == "admin" || user.id == entity.createdBy',
    
    // Admin, manager, or owner
    adminManagerOrOwner: 'user.role == "admin" || user.role == "manager" || user.id == entity.createdBy',
    
    // Self-access only (for user entities)
    selfOnly: 'user.id == entity.id',
    
    // Admin or self
    adminOrSelf: 'user.role == "admin" || user.id == entity.id',
  };
}

export { PermissionEvaluator as default };