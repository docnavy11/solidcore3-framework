import { ValidationContext, ValidationErrorCode } from './types.ts';
import { SafeExpressionParser } from '../expression/parser.ts';

export class PermissionValidator {
  private expressionParser: SafeExpressionParser;
  
  constructor() {
    this.expressionParser = new SafeExpressionParser();
  }
  
  validate(permissions: any, entityName: string, context: ValidationContext): void {
    const permissionsPath = `entities.${entityName}.permissions`;
    
    const validPermissions = ['create', 'read', 'update', 'delete'];
    
    for (const [permission, expression] of Object.entries(permissions)) {
      const permissionPath = `${permissionsPath}.${permission}`;
      
      // Check if permission type is valid
      if (!validPermissions.includes(permission)) {
        context.addWarning(context.createWarning(
          'PERMISSION_TYPE_UNKNOWN',
          `Unknown permission type '${permission}' in entity '${entityName}'`,
          permissionPath,
          `Valid permissions: ${validPermissions.join(', ')}`,
          { permission, validPermissions }
        ));
      }
      
      // Expression must be a string
      if (typeof expression !== 'string') {
        context.addError(context.createError(
          ValidationErrorCode.PERMISSION_INVALID_EXPRESSION,
          `Permission '${permission}' expression must be a string`,
          permissionPath,
          'Use a string expression like: "user.role == \\"admin\\""'
        ));
        continue;
      }
      
      // Validate expression syntax
      const validationResult = this.expressionParser.validate(expression);
      if (!validationResult.success) {
        context.addError(context.createError(
          ValidationErrorCode.PERMISSION_INVALID_EXPRESSION,
          `Permission '${permission}' has invalid expression syntax: ${validationResult.error}`,
          permissionPath,
          'Check expression syntax. Example: "user.role == \\"admin\\" || user.id == entityId"',
          { expression, syntaxError: validationResult.error }
        ));
      }
      
      // Check for potentially problematic expressions
      this.validatePermissionExpression(expression, permission, permissionPath, context);
    }
  }
  
  private validatePermissionExpression(expression: string, permission: string, path: string, context: ValidationContext): void {
    // Check for always-true expressions
    const alwaysTruePatterns = [
      'true',
      '1 == 1',
      '"a" == "a"'
    ];
    
    if (alwaysTruePatterns.includes(expression.trim())) {
      if (permission === 'delete') {
        context.addWarning(context.createWarning(
          'PERMISSION_ALWAYS_TRUE_DELETE',
          `Delete permission is always true, which may be dangerous`,
          path,
          'Consider adding conditions to restrict delete access',
          { expression }
        ));
      } else if (permission === 'update') {
        context.addWarning(context.createWarning(
          'PERMISSION_ALWAYS_TRUE_UPDATE',
          `Update permission is always true, consider adding restrictions`,
          path,
          'Example: "user.role == \\"admin\\" || user.id == entityId"',
          { expression }
        ));
      }
    }
    
    // Check for always-false expressions
    const alwaysFalsePatterns = [
      'false',
      '1 == 2',
      '"a" == "b"'
    ];
    
    if (alwaysFalsePatterns.includes(expression.trim())) {
      context.addWarning(context.createWarning(
        'PERMISSION_ALWAYS_FALSE',
        `Permission '${permission}' is always false`,
        path,
        'This will block all access. Consider if this is intentional.',
        { expression }
      ));
    }
    
    // Check for common security patterns
    if (expression.includes('user.role') && !expression.includes('admin')) {
      context.addWarning(context.createWarning(
        'PERMISSION_NO_ADMIN_ROLE',
        `Permission '${permission}' checks user role but doesn't include admin`,
        path,
        'Consider: "user.role == \\"admin\\" || <your condition>"',
        { expression }
      ));
    }
    
    // Check for potentially unsafe patterns
    if (expression.includes('!=') && expression.includes('""')) {
      context.addWarning(context.createWarning(
        'PERMISSION_EMPTY_STRING_CHECK',
        `Permission '${permission}' checks for non-empty string, which may not work as expected`,
        path,
        'Empty string checks can be tricky. Consider using existence checks.',
        { expression }
      ));
    }
  }
}