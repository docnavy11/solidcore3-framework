import { ValidationContext, ValidationErrorCode, ValidationUtils } from './types.ts';

export class ViewValidator {
  validate(view: any, viewName: string, context: ValidationContext): void {
    const viewPath = `views.${viewName}`;
    
    // View must be an object
    if (!view || typeof view !== 'object') {
      context.addError(context.createError(
        'VIEW_INVALID_STRUCTURE',
        `View '${viewName}' must be an object`,
        viewPath,
        'Define view as: { type: "list", entity: "EntityName", route: "/path" }'
      ));
      return;
    }
    
    // Validate type (required)
    this.validateViewType(view, viewName, viewPath, context);
    
    // Validate route (required)
    this.validateViewRoute(view, viewName, viewPath, context);
    
    // Validate entity (required for most view types)
    this.validateViewEntity(view, viewName, viewPath, context);
    
    // Type-specific validation
    this.validateViewTypeSpecific(view, viewName, viewPath, context);
    
    // General view properties
    this.validateViewProperties(view, viewName, viewPath, context);
  }
  
  private validateViewType(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Type is required
    if (!view.type) {
      context.addError(context.createError(
        ValidationErrorCode.VIEW_TYPE_INVALID,
        `View '${viewName}' must have a type`,
        `${viewPath}.type`,
        'Valid types: list, form, detail, custom, kanban, calendar, dashboard',
        { viewName }
      ));
      return;
    }
    
    // Type must be valid
    if (!ValidationUtils.isValidViewType(view.type)) {
      context.addError(context.createError(
        ValidationErrorCode.VIEW_TYPE_INVALID,
        `View '${viewName}' has invalid type '${view.type}'`,
        `${viewPath}.type`,
        'Valid types: list, form, detail, custom, kanban, calendar, dashboard',
        { viewName, invalidType: view.type }
      ));
    }
  }
  
  private validateViewRoute(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Route is required
    if (!view.route) {
      context.addError(context.createError(
        ValidationErrorCode.VIEW_ROUTE_INVALID,
        `View '${viewName}' must have a route`,
        `${viewPath}.route`,
        'Add route: { route: "/tasks" } or { route: "/tasks/new" }',
        { viewName }
      ));
      return;
    }
    
    // Route must be a string
    if (typeof view.route !== 'string') {
      context.addError(context.createError(
        ValidationErrorCode.VIEW_ROUTE_INVALID,
        `View '${viewName}' route must be a string`,
        `${viewPath}.route`,
        'Use string route: "/tasks" or "/users/:id"'
      ));
      return;
    }
    
    // Route must be valid format
    if (!ValidationUtils.isValidRoute(view.route)) {
      context.addError(context.createError(
        ValidationErrorCode.VIEW_ROUTE_INVALID,
        `View '${viewName}' route '${view.route}' is not valid`,
        `${viewPath}.route`,
        'Routes must start with / and contain only valid characters',
        { route: view.route }
      ));
    }
    
    // Check for route parameters consistency
    const hasParam = view.route.includes(':');
    const needsParam = view.type === 'detail' || (view.type === 'form' && view.mode === 'edit');
    
    if (needsParam && !hasParam) {
      context.addWarning(context.createWarning(
        'VIEW_ROUTE_MISSING_PARAM',
        `View '${viewName}' of type '${view.type}' typically needs a route parameter`,
        `${viewPath}.route`,
        'Consider using route like: "/tasks/:id"',
        { viewType: view.type, route: view.route }
      ));
    }
    
    if (!needsParam && hasParam && view.type === 'list') {
      context.addWarning(context.createWarning(
        'VIEW_ROUTE_UNEXPECTED_PARAM',
        `View '${viewName}' of type 'list' typically doesn't need route parameters`,
        `${viewPath}.route`,
        'List views usually use routes like: "/tasks"',
        { route: view.route }
      ));
    }
  }
  
  private validateViewEntity(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Entity is required for data-driven view types, but not for custom views
    const requiresEntity = ['list', 'form', 'detail', 'kanban', 'calendar'].includes(view.type);
    
    if (requiresEntity && !view.entity) {
      context.addError(context.createError(
        ValidationErrorCode.VIEW_ENTITY_NOT_FOUND,
        `View '${viewName}' of type '${view.type}' must specify an entity`,
        `${viewPath}.entity`,
        'Add entity: { entity: "EntityName" }',
        { viewName, viewType: view.type }
      ));
      return;
    }
    
    // If entity is specified, it must be a string
    if (view.entity && typeof view.entity !== 'string') {
      context.addError(context.createError(
        'VIEW_ENTITY_INVALID',
        `View '${viewName}' entity must be a string`,
        `${viewPath}.entity`,
        'Specify entity name: { entity: "Task" }'
      ));
    }
  }
  
  private validateViewTypeSpecific(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    switch (view.type) {
      case 'list':
        this.validateListView(view, viewName, viewPath, context);
        break;
        
      case 'form':
        this.validateFormView(view, viewName, viewPath, context);
        break;
        
      case 'detail':
        this.validateDetailView(view, viewName, viewPath, context);
        break;
        
      case 'custom':
        this.validateCustomView(view, viewName, viewPath, context);
        break;
        
      case 'kanban':
        this.validateKanbanView(view, viewName, viewPath, context);
        break;
        
      case 'calendar':
        this.validateCalendarView(view, viewName, viewPath, context);
        break;
        
      case 'dashboard':
        this.validateDashboardView(view, viewName, viewPath, context);
        break;
    }
  }
  
  private validateListView(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Validate columns (optional)
    if (view.columns) {
      if (!Array.isArray(view.columns)) {
        context.addError(context.createError(
          'VIEW_LIST_COLUMNS_INVALID',
          `List view '${viewName}' columns must be an array`,
          `${viewPath}.columns`,
          'Define columns as: ["title", "status", "createdAt"]'
        ));
      } else {
        // Check column names are strings
        view.columns.forEach((column: any, index: number) => {
          if (typeof column !== 'string') {
            context.addError(context.createError(
              'VIEW_LIST_COLUMN_INVALID',
              `List view '${viewName}' column ${index} must be a string`,
              `${viewPath}.columns[${index}]`,
              'Use field names: "title", "status", etc.'
            ));
          }
        });
      }
    }
    
    // Validate filters (optional)
    if (view.filters && typeof view.filters !== 'object') {
      context.addError(context.createError(
        'VIEW_LIST_FILTERS_INVALID',
        `List view '${viewName}' filters must be an object`,
        `${viewPath}.filters`,
        'Define filters as: { status: ["active", "pending"] }'
      ));
    }
    
    // Validate sorting (optional)
    if (view.sort) {
      if (typeof view.sort !== 'string' && typeof view.sort !== 'object') {
        context.addError(context.createError(
          'VIEW_LIST_SORT_INVALID',
          `List view '${viewName}' sort must be a string or object`,
          `${viewPath}.sort`,
          'Use: "createdAt" or { field: "createdAt", direction: "desc" }'
        ));
      }
    }
  }
  
  private validateFormView(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Validate mode (optional, defaults to 'create')
    if (view.mode && !['create', 'edit'].includes(view.mode)) {
      context.addError(context.createError(
        'VIEW_FORM_MODE_INVALID',
        `Form view '${viewName}' mode must be 'create' or 'edit'`,
        `${viewPath}.mode`,
        'Use: { mode: "create" } or { mode: "edit" }',
        { mode: view.mode }
      ));
    }
    
    // Validate fields (optional)
    if (view.fields) {
      if (!Array.isArray(view.fields)) {
        context.addError(context.createError(
          'VIEW_FORM_FIELDS_INVALID',
          `Form view '${viewName}' fields must be an array`,
          `${viewPath}.fields`,
          'Define fields as: ["title", "description", "status"]'
        ));
      } else {
        // Check field names are strings
        view.fields.forEach((field: any, index: number) => {
          if (typeof field !== 'string') {
            context.addError(context.createError(
              'VIEW_FORM_FIELD_INVALID',
              `Form view '${viewName}' field ${index} must be a string`,
              `${viewPath}.fields[${index}]`,
              'Use field names from the entity definition'
            ));
          }
        });
      }
    }
    
    // Edit forms should have route parameters
    if (view.mode === 'edit' && view.route && !view.route.includes(':')) {
      context.addWarning(context.createWarning(
        'VIEW_FORM_EDIT_NO_PARAM',
        `Edit form view '${viewName}' should have a route parameter`,
        `${viewPath}.route`,
        'Use route like: "/tasks/:id/edit"'
      ));
    }
  }
  
  private validateDetailView(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Detail views should have route parameters
    if (view.route && !view.route.includes(':')) {
      context.addWarning(context.createWarning(
        'VIEW_DETAIL_NO_PARAM',
        `Detail view '${viewName}' should have a route parameter`,
        `${viewPath}.route`,
        'Use route like: "/tasks/:id"'
      ));
    }
    
    // Validate fields (optional)
    if (view.fields) {
      if (!Array.isArray(view.fields)) {
        context.addError(context.createError(
          'VIEW_DETAIL_FIELDS_INVALID',
          `Detail view '${viewName}' fields must be an array`,
          `${viewPath}.fields`,
          'Define fields as: ["title", "description", "createdAt"]'
        ));
      } else {
        // Check field names are strings
        view.fields.forEach((field: any, index: number) => {
          if (typeof field !== 'string') {
            context.addError(context.createError(
              'VIEW_DETAIL_FIELD_INVALID',
              `Detail view '${viewName}' field ${index} must be a string`,
              `${viewPath}.fields[${index}]`,
              'Use field names from the entity definition'
            ));
          }
        });
      }
    }
  }
  
  private validateCustomView(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Custom views should have either template or content
    if (!view.template && !view.content) {
      context.addWarning(context.createWarning(
        'VIEW_CUSTOM_NO_CONTENT',
        `Custom view '${viewName}' should specify either template or content`,
        viewPath,
        'Add template: { template: "about" } or content: { content: "Static HTML" }'
      ));
    }
    
    // Validate template (optional)
    if (view.template !== undefined && typeof view.template !== 'string') {
      context.addError(context.createError(
        'VIEW_CUSTOM_TEMPLATE_INVALID',
        `Custom view '${viewName}' template must be a string`,
        `${viewPath}.template`,
        'Use template name: { template: "about" }'
      ));
    }
    
    // Validate content (optional)
    if (view.content !== undefined && typeof view.content !== 'string') {
      context.addError(context.createError(
        'VIEW_CUSTOM_CONTENT_INVALID',
        `Custom view '${viewName}' content must be a string`,
        `${viewPath}.content`,
        'Use HTML content: { content: "<h1>Welcome</h1>" }'
      ));
    }
    
    // Custom views shouldn't have entity
    if (view.entity) {
      context.addWarning(context.createWarning(
        'VIEW_CUSTOM_HAS_ENTITY',
        `Custom view '${viewName}' doesn't need an entity`,
        `${viewPath}.entity`,
        'Remove entity property for custom views'
      ));
    }
    
    // Custom views shouldn't have route parameters
    if (view.route && view.route.includes(':')) {
      context.addWarning(context.createWarning(
        'VIEW_CUSTOM_HAS_PARAM',
        `Custom view '${viewName}' typically doesn't need route parameters`,
        `${viewPath}.route`,
        'Use static routes like: "/about" or "/help"'
      ));
    }
  }
  
  private validateViewProperties(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Validate title
    if (view.title !== undefined && typeof view.title !== 'string') {
      context.addError(context.createError(
        'VIEW_TITLE_INVALID',
        `View '${viewName}' title must be a string`,
        `${viewPath}.title`
      ));
    }
    
    // Validate description
    if (view.description !== undefined && typeof view.description !== 'string') {
      context.addError(context.createError(
        'VIEW_DESCRIPTION_INVALID',
        `View '${viewName}' description must be a string`,
        `${viewPath}.description`
      ));
    }
    
    // Validate layout (optional)
    if (view.layout !== undefined && typeof view.layout !== 'string') {
      context.addError(context.createError(
        'VIEW_LAYOUT_INVALID',
        `View '${viewName}' layout must be a string`,
        `${viewPath}.layout`
      ));
    }
    
    // Check for reasonable view naming
    if (viewName.length < 3) {
      context.addWarning(context.createWarning(
        'VIEW_NAME_TOO_SHORT',
        `View name '${viewName}' is very short`,
        viewPath,
        'Consider using more descriptive view names'
      ));
    }
    
    // Suggest naming conventions
    if (view.type === 'list' && !viewName.toLowerCase().includes('list')) {
      context.addWarning(context.createWarning(
        'VIEW_LIST_NAMING',
        `List view '${viewName}' might benefit from including 'list' in the name`,
        viewPath,
        'Consider names like: TaskList, UserList, etc.'
      ));
    }
    
    if (view.type === 'form' && !viewName.toLowerCase().includes('form') && !viewName.toLowerCase().includes('create') && !viewName.toLowerCase().includes('edit')) {
      context.addWarning(context.createWarning(
        'VIEW_FORM_NAMING',
        `Form view '${viewName}' might benefit from clearer naming`,
        viewPath,
        'Consider names like: CreateTask, EditUser, TaskForm, etc.'
      ));
    }
  }
  
  private validateKanbanView(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Kanban views require an entity
    if (!view.entity) {
      context.addError(context.createError(
        ValidationErrorCode.VIEW_ENTITY_NOT_FOUND,
        `Kanban view '${viewName}' must specify an entity`,
        `${viewPath}.entity`,
        'Add entity: { entity: "EntityName" }',
        { viewName, viewType: view.type }
      ));
    }
    
    // Validate groupBy field (required for kanban)
    if (!view.groupBy) {
      context.addWarning(context.createWarning(
        'VIEW_KANBAN_NO_GROUP_BY',
        `Kanban view '${viewName}' should specify a groupBy field`,
        `${viewPath}.groupBy`,
        'Add groupBy: { groupBy: "status" } to organize cards into columns'
      ));
    } else if (typeof view.groupBy !== 'string') {
      context.addError(context.createError(
        'VIEW_KANBAN_GROUP_BY_INVALID',
        `Kanban view '${viewName}' groupBy must be a string`,
        `${viewPath}.groupBy`,
        'Use field name: { groupBy: "status" }'
      ));
    }
    
    // Validate cardFields (optional)
    if (view.cardFields && !Array.isArray(view.cardFields)) {
      context.addError(context.createError(
        'VIEW_KANBAN_CARD_FIELDS_INVALID',
        `Kanban view '${viewName}' cardFields must be an array`,
        `${viewPath}.cardFields`,
        'Define fields as: ["title", "priority", "assignedTo"]'
      ));
    }
  }
  
  private validateCalendarView(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Calendar views require an entity
    if (!view.entity) {
      context.addError(context.createError(
        ValidationErrorCode.VIEW_ENTITY_NOT_FOUND,
        `Calendar view '${viewName}' must specify an entity`,
        `${viewPath}.entity`,
        'Add entity: { entity: "EntityName" }',
        { viewName, viewType: view.type }
      ));
    }
    
    // Validate dateField (required for calendar)
    if (!view.dateField) {
      context.addWarning(context.createWarning(
        'VIEW_CALENDAR_NO_DATE_FIELD',
        `Calendar view '${viewName}' should specify a dateField`,
        `${viewPath}.dateField`,
        'Add dateField: { dateField: "dueDate" } to show events on calendar'
      ));
    } else if (typeof view.dateField !== 'string') {
      context.addError(context.createError(
        'VIEW_CALENDAR_DATE_FIELD_INVALID',
        `Calendar view '${viewName}' dateField must be a string`,
        `${viewPath}.dateField`,
        'Use field name: { dateField: "dueDate" }'
      ));
    }
    
    // Validate eventFields (optional)
    if (view.eventFields && !Array.isArray(view.eventFields)) {
      context.addError(context.createError(
        'VIEW_CALENDAR_EVENT_FIELDS_INVALID',
        `Calendar view '${viewName}' eventFields must be an array`,
        `${viewPath}.eventFields`,
        'Define fields as: ["title", "description", "priority"]'
      ));
    }
  }
  
  private validateDashboardView(view: any, viewName: string, viewPath: string, context: ValidationContext): void {
    // Dashboard views typically don't need an entity (they're aggregate views)
    if (view.entity) {
      context.addWarning(context.createWarning(
        'VIEW_DASHBOARD_HAS_ENTITY',
        `Dashboard view '${viewName}' typically doesn't need a specific entity`,
        `${viewPath}.entity`,
        'Dashboards usually aggregate data from multiple entities'
      ));
    }
    
    // Validate metrics (optional)
    if (view.metrics && !Array.isArray(view.metrics)) {
      context.addError(context.createError(
        'VIEW_DASHBOARD_METRICS_INVALID',
        `Dashboard view '${viewName}' metrics must be an array`,
        `${viewPath}.metrics`,
        'Define metrics as: [{ key: "totalTasks", title: "Total Tasks", icon: "tasks" }]'
      ));
    }
    
    // Validate widgets (optional)
    if (view.widgets && !Array.isArray(view.widgets)) {
      context.addError(context.createError(
        'VIEW_DASHBOARD_WIDGETS_INVALID',
        `Dashboard view '${viewName}' widgets must be an array`,
        `${viewPath}.widgets`,
        'Define widgets as: [{ type: "recent", title: "Recent Tasks" }]'
      ));
    }
  }
}