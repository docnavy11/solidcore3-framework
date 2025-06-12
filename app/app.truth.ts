import { AppDefinition } from '../core/types/index.ts';

export const App: AppDefinition = {
  name: 'TaskManager',
  version: '1.0.0',
  description: 'A simple task management application',

  settings: {
    auth: {
      enabled: true,
      sessionTimeout: 86400, // 24 hours in seconds
    },
  },

  // Data model
  entities: {
    User: {
      fields: {
        id: {
          type: 'string',
          unique: true,
        },
        createdAt: {
          type: 'date',
        },
        updatedAt: {
          type: 'date',
        },
        email: {
          type: 'string',
          required: true,
          maxLength: 255,
          unique: true,
        },
        password: {
          type: 'string',
          required: true,
          maxLength: 255,
        },
        name: {
          type: 'string',
          required: true,
          maxLength: 100,
        },
        role: {
          type: 'enum',
          options: ['admin', 'manager', 'user'],
          default: 'user',
          required: true,
        },
        isActive: {
          type: 'boolean',
          default: true,
          required: true,
        },
        lastLoginAt: {
          type: 'date',
          required: false,
        },
      },
      permissions: {
        create: 'user.role == "admin"',
        read: 'authenticated && (user.role == "admin" || user.id == entity.id)',
        update: 'authenticated && (user.role == "admin" || user.id == entity.id)',
        delete: 'user.role == "admin"',
      },
      behaviors: {
        login: {
          type: 'custom',
          emits: 'user.login',
        },
        logout: {
          type: 'custom',
          emits: 'user.logout',
        },
      },
    },
    Person: {
      fields: {
        id: {
          type: 'string',
          unique: true,
        },
        createdAt: {
          type: 'date',
        },
        updatedAt: {
          type: 'date',
        },
        name: {
          type: 'string',
          required: true,
          maxLength: 100,
        },
        email: {
          type: 'string',
          required: true,
          maxLength: 255,
        },
        role: {
          type: 'enum',
          options: ['developer', 'designer', 'manager', 'tester'],
          default: 'developer',
          required: true,
        },
        department: {
          type: 'string',
          required: false,
          maxLength: 100,
        },
        userId: {
          type: 'relation',
          to: 'User',
          required: false,
        },
      },
      permissions: {
        create: 'authenticated && (user.role == "admin" || user.role == "manager")',
        read: 'authenticated',
        update: 'authenticated && (user.role == "admin" || user.role == "manager" || user.id == entity.userId)',
        delete: 'authenticated && (user.role == "admin" || user.role == "manager")',
      },
    },
    Task: {
      fields: {
        id: {
          type: 'string',
          unique: true,
        },
        createdAt: {
          type: 'date',
        },
        updatedAt: {
          type: 'date',
        },
        title: {
          type: 'string',
          required: true,
          maxLength: 200,
        },
        description: {
          type: 'string',
          required: false,
        },
        status: {
          type: 'enum',
          options: ['todo', 'in-progress', 'done', 'archived'],
          default: 'todo',
          required: true,
        },
        priority: {
          type: 'enum',
          options: ['low', 'medium', 'high'],
          default: 'medium',
        },
        dueDate: {
          type: 'date',
          required: false,
        },
        assignedTo: {
          type: 'relation',
          to: 'Person',
          required: false,
        },
        createdBy: {
          type: 'relation',
          to: 'User',
          required: true,
        },
      },
      permissions: {
        create: 'authenticated',
        read: 'authenticated',
        update: 'authenticated && (user.role == "admin" || user.role == "manager" || user.id == entity.createdBy)',
        delete: 'authenticated && (user.role == "admin" || user.id == entity.createdBy)',
      },
      behaviors: {
        complete: {
          type: 'update',
          fields: { status: 'done' },
          emits: 'task.completed',
        },
        archive: {
          type: 'update',
          fields: { status: 'archived' },
          emits: 'task.archived',
        },
      },
    },
  },

  // Web pages
  views: {
    Dashboard: {
      type: 'custom',
      route: '/dashboard',
      title: 'Dashboard',
      template: 'dashboard',
    },
    TaskList: {
      type: 'list',
      route: '/tasks',
      entity: 'Task',
      title: 'All Tasks',
    },
    TaskList2: {
      type: 'list',
      route: '/tasks2',
      entity: 'Task',
      title: 'Tasks Alternative View',
    },
    TaskDetail: {
      type: 'detail',
      route: '/tasks/:id',
      entity: 'Task',
    },
    CreateTask: {
      type: 'form',
      route: '/tasks/new',
      entity: 'Task',
      mode: 'create',
      title: 'Create New Task',
    },
    EditTask: {
      type: 'form',
      route: '/tasks/:id/edit',
      entity: 'Task',
      mode: 'edit',
      title: 'Edit Task',
    },
    PersonList: {
      type: 'list',
      route: '/people',
      entity: 'Person',
      title: 'All People',
    },
    PersonDetail: {
      type: 'detail',
      route: '/people/:id',
      entity: 'Person',
    },
    CreatePerson: {
      type: 'form',
      route: '/people/new',
      entity: 'Person',
      mode: 'create',
      title: 'Create New Person',
    },
    EditPerson: {
      type: 'form',
      route: '/people/:id/edit',
      entity: 'Person',
      mode: 'edit',
      title: 'Edit Person',
    },
    TaskBoard: {
      type: 'kanban',
      route: '/tasks/board',
      entity: 'Task',
      groupBy: 'status',
      title: 'Task Board',
    },
    Login: {
      type: 'custom',
      route: '/login',
      title: 'Login',
      template: 'login',
    },
    Register: {
      type: 'custom',
      route: '/register',
      title: 'Register',
      template: 'register',
    },
    UserProfile: {
      type: 'detail',
      route: '/profile/:id',
      entity: 'User',
      title: 'My Profile',
    },
    UserList: {
      type: 'list',
      route: '/users',
      entity: 'User',
      title: 'All Users',
    },
  },
};