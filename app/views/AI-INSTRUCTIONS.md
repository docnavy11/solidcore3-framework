# 🤖 AI Instructions: Working with Scaffolded Views

This directory contains **generated view components** from Solidcore3's scaffolding system. Here's how to work with them effectively:

## Decision Tree: Modify Skeleton vs Individual File

### 🏗️ **Modify Skeleton First** (Recommended for structural changes)

**When the change affects the fundamental structure or should apply to ALL components of this type:**

- **Layout changes** - Headers, footers, card structure, spacing
- **Validation patterns** - Required fields, error handling, form validation
- **UI components** - Buttons, inputs, tables, modals
- **Navigation patterns** - Breadcrumbs, back buttons, action buttons  
- **Data handling** - Loading states, error states, hook patterns
- **Accessibility** - ARIA labels, keyboard navigation, screen readers
- **Performance** - Memoization, virtualization, optimization patterns

**How to modify skeleton:**
1. Find the template file (see comment at top of each generated file)
2. Edit the `.template.js` file with full IDE support
3. Run `touch app/app.truth.ts` to regenerate all components
4. See your improvements applied across the entire app! ✨

### 📝 **Modify Individual File** (For specific customizations)

**When the change is unique to this specific component:**

- **Entity-specific logic** - Custom calculations, specific business rules
- **One-off features** - Special buttons, unique layouts, custom styling
- **Integration code** - Third-party APIs, specific external services
- **Custom hooks** - Component-specific state management
- **Temporary fixes** - Quick patches before skeleton update

**How to modify individual file:**
1. Edit the generated component directly
2. Use `.hooks.js` files for clean extensibility
3. Document why this component is special

## Understanding Generated Files

### File Structure
```
app/views/
├── TaskList.js           # Generated list component
├── TaskDetail.js         # Generated detail component  
├── CreateTask.js         # Generated form component
├── EditTask.js           # Generated form component
├── PersonList.js         # Generated list component
└── AI-INSTRUCTIONS.md    # This file
```

### Component Types

#### 📋 **List Components** (`*List.js`)
**Purpose:** Display tables of data with filtering, sorting, and actions

**Common modifications:**
- **Skeleton:** Add/remove columns, change table layout, add bulk actions
- **Individual:** Custom filters for specific entities, special row styling

**Template:** `app/templates/system/list.template.js`

#### 📄 **Detail Components** (`*Detail.js`)  
**Purpose:** Show single item details with actions

**Common modifications:**
- **Skeleton:** Change field layout, add/remove action buttons, modify formatting
- **Individual:** Custom field displays, entity-specific actions

**Template:** `app/templates/system/detail.template.js`

#### 📝 **Form Components** (`Create*.js`, `Edit*.js`)
**Purpose:** Create/edit forms with validation

**Common modifications:**
- **Skeleton:** Add validation patterns, change form layout, add/remove form sections
- **Individual:** Custom validation rules, entity-specific form logic

**Template:** `app/templates/system/form.template.js`

## Extension Points

### 🪝 **Enhanced Hooks System**
Each generated component supports optional `.hooks.js` files for clean customization with full framework integration:

```javascript
// TaskList.hooks.js
export default {
  beforeRender: (data, { user, permissions }) => {
    // Transform data with auth context
    const filtered = data.filter(task => !task.archived)
    // Apply user-specific filtering
    if (user.role === 'user') {
      return filtered.filter(task => task.assignedTo === user.id)
    }
    return filtered
  },
  
  beforeContent: ({ user }) => html`
    <div class="custom-header">
      <h2>Welcome ${user.name}</h2>
      <div class="user-stats">Your tasks: ${userTaskCount}</div>
    </div>
  `,
  
  customActions: [
    { 
      label: 'Archive', 
      onClick: (item) => archiveTask(item.id),
      permission: 'update', // Automatic permission check
      requiresOwnership: true // Only show for owners
    }
  ],
  
  customValidation: {
    beforeSubmit: (data) => {
      // Custom validation logic
      if (data.priority === 'high' && !data.dueDate) {
        return { error: 'High priority tasks must have a due date' }
      }
      return { valid: true }
    }
  }
}
```

**Available hooks (with auth/validation context):**
- `beforeRender(data, context)` - Transform data with user context
- `beforeContent(context)` - Add content with user/permission info
- `afterContent(context)` - Add content with auth context
- `headerContent(context)` - Add authenticated header content
- `footerContent(context)` - Add footer with user context
- `customActions` - Permission-aware custom action buttons
- `beforeSubmit(data, context)` - Transform/validate with user context
- `afterSubmit(result, context)` - Post-submission logic with auth
- `onError(error, context)` - Custom error handling with recovery
- `customValidation` - Additional validation rules
- `permissionOverrides` - Custom permission logic
- `authRedirects` - Custom authentication flow handling

### 🎨 **Styling**
Generated components use CSS classes that follow patterns:

```css
.{entity}-list       /* List containers */
.{entity}-detail     /* Detail containers */  
.{entity}-form       /* Form containers */
.form-grid          /* Form field layouts */
.detail-grid        /* Detail field layouts */
```

## Regeneration

### ⚡ **Auto-Regeneration**
Views are regenerated when:
- Server starts (if enabled)
- Truth file changes (touch `app/app.truth.ts`)
- View files are deleted

### 🔄 **Manual Regeneration**
```bash
# Regenerate all views
touch app/app.truth.ts

# Regenerate specific view  
rm app/views/TaskList.js
touch app/app.truth.ts
```

### ⚠️ **What Gets Preserved**
- **Individual file edits** - Will be overwritten on regeneration
- **Hook files** (`.hooks.js`) - Always preserved
- **Custom components** - Files not generated from truth file

## Common Patterns

### ✅ **Good Practices**

```javascript
// ✅ Use hooks for custom logic
// TaskList.hooks.js
export default {
  customActions: [
    { label: 'Export CSV', onClick: exportTasks }
  ]
}

// ✅ Modify skeleton for structural changes
// In app/templates/system/list.template.js
<div class="list-header">
  <h1>__LIST_TITLE__</h1>
  <div class="header-actions">
    __CREATE_BUTTON__
    <button class="export-btn">Export</button>  // Added to all lists!
  </div>
</div>
```

### ❌ **Avoid These Patterns**

```javascript
// ❌ Don't modify generated files for structural changes
// TaskList.js (will be overwritten!)
<div class="list-header">
  <h1>All Tasks</h1>
  <button class="export-btn">Export</button>  // Will be lost on regeneration!
</div>

// ❌ Don't duplicate logic across multiple components
// TaskList.js, PersonList.js, etc. (modify skeleton instead!)
const handleExport = () => {
  // Same export logic in every list component
}
```

## Example Workflows

### 📊 **Adding Export Functionality to All Lists**

**1. Modify Skeleton (Recommended):**
```javascript
// In app/templates/system/list.template.js
<div class="list-actions">
  __CREATE_BUTTON__
  <${Button} onClick=${() => exportData(sortedData, '__ENTITY_LOWER__')}>
    Export CSV
  </${Button}>
</div>
```

**2. Regenerate:**
```bash
touch app/app.truth.ts
```

**3. Result:** All lists now have export functionality! ✨

### 🎨 **Adding Custom Styling to Task Lists Only**

**1. Use hooks for specific customization:**
```javascript
// TaskList.hooks.js
export default {
  beforeContent: () => html`
    <style>
      .task-list .high-priority { background: #fee2e2; }
    </style>
  `,
  
  beforeRender: (data) => {
    return data.map(task => ({
      ...task,
      className: task.priority === 'high' ? 'high-priority' : ''
    }))
  }
}
```

### 🔧 **Adding Validation to All Forms**

**1. Modify skeleton:**
```javascript
// In app/templates/system/form.template.js
const validateForm = () => {
  const newErrors = {}
  
__VALIDATION_RULES__
  
  // Add global validation rules
  if (formData.email && !formData.email.includes('@')) {
    newErrors.email = 'Please enter a valid email'
  }
  
  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}
```

**2. Regenerate:** All forms now have email validation!

## Quick Reference

| Task | Method | File |
|------|--------|------|
| Change all list layouts | Modify skeleton | `app/templates/system/list.template.js` |
| Change all form validation | Modify skeleton | `app/templates/system/form.template.js` |
| Change all detail displays | Modify skeleton | `app/templates/system/detail.template.js` |
| Add custom action to one list | Use hooks | `{ComponentName}.hooks.js` |
| Create new component type | New skeleton | See `app/system/AI-SKELETON-GUIDE.md` |
| Regenerate views | Touch truth | `touch app/app.truth.ts` |

## Remember

🎯 **The Goal:** Maximize systematic improvements, minimize one-off fixes

✨ **The Magic:** Change the skeleton once, improve the entire app

🤖 **For AI:** Always consider the skeleton first - it's usually the better choice!

---

*For creating entirely new skeleton types, see: `app/system/AI-SKELETON-GUIDE.md`*