// app/app.truth.ts
import { AppDefinition } from '../core/types/index.ts';

export const App: AppDefinition = {
  name: 'BlogCMS',
  version: '1.0.0',
  description: 'A complete blog management system',

  entities: {
    // Authors who write posts
    Author: {
      fields: {
        id: { type: 'uuid', auto: true, unique: true },
        name: { type: 'string', required: true, maxLength: 100 },
        email: { type: 'string', required: true, unique: true },
        bio: { type: 'text' },
        avatar: { type: 'string' },
        isActive: { type: 'boolean', default: true }
      },
      
      ui: {
        display: {
          primary: 'name',
          secondary: 'email',
          avatar: 'avatar',
          badge: 'isActive'
        },
        list: {
          columns: ['name', 'email', 'isActive'],
          searchable: ['name', 'email'],
          actions: ['view', 'edit']
        }
      },
      
      permissions: {
        create: 'admin',
        read: 'authenticated',
        update: 'admin || user.id === entity.id',
        delete: 'admin'
      }
    },

    // Blog categories
    Category: {
      fields: {
        id: { type: 'uuid', auto: true, unique: true },
        name: { type: 'string', required: true, maxLength: 50 },
        slug: { type: 'string', required: true, unique: true },
        description: { type: 'text' },
        color: { type: 'string', default: '#0066cc' }
      },
      
      ui: {
        display: {
          primary: 'name',
          secondary: 'description',
          color: { field: 'name', map: { 'Technology': '#0066cc', 'Lifestyle': '#28a745' } }
        }
      },
      
      permissions: {
        create: 'admin',
        read: 'public',
        update: 'admin',
        delete: 'admin'
      }
    },

    // Blog posts
    Post: {
      fields: {
        id: { type: 'uuid', auto: true, unique: true },
        title: { type: 'string', required: true, maxLength: 200 },
        slug: { type: 'string', required: true, unique: true },
        content: { type: 'text', required: true },
        excerpt: { type: 'text' },
        status: { 
          type: 'enum', 
          values: ['draft', 'published', 'archived'], 
          default: 'draft' 
        },
        featured: { type: 'boolean', default: false },
        publishedAt: { type: 'datetime' },
        authorId: { type: 'relation', to: 'Author', required: true },
        categoryId: { type: 'relation', to: 'Category' },
        tags: { type: 'json', default: [] },
        viewCount: { type: 'integer', default: 0 },
        metadata: { type: 'json', default: {} }
      },
      
      behaviors: {
        publish: {
          modifies: { status: 'published', publishedAt: 'now' },
          emits: 'post.published',
          requires: 'canPublish'
        },
        feature: {
          modifies: { featured: true },
          emits: 'post.featured'
        },
        archive: {
          modifies: { status: 'archived' },
          emits: 'post.archived'
        }
      },
      
      computed: {
        isPublished: 'status === "published"',
        daysSincePublished: '(Date.now() - publishedAt) / (24 * 60 * 60 * 1000)'
      },
      
      indexes: [
        ['status', 'publishedAt'],
        ['authorId'],
        ['categoryId'],
        ['featured']
      ],
      
      ui: {
        display: {
          primary: 'title',
          secondary: 'excerpt',
          badge: 'status',
          color: {
            field: 'status',
            map: {
              draft: '#6c757d',
              published: '#28a745', 
              archived: '#dc3545'
            }
          },
          metadata: ['publishedAt', 'viewCount']
        },
        
        list: {
          columns: ['title', 'status', 'author', 'category', 'publishedAt'],
          sortable: ['title', 'publishedAt', 'viewCount'],
          filterable: ['status', 'categoryId', 'featured'],
          searchable: ['title', 'content', 'excerpt'],
          actions: ['view', 'edit', 'delete']
        },
        
        form: {
          layout: 'sections',
          sections: [
            {
              title: 'Content',
              fields: ['title', 'slug', 'content', 'excerpt']
            },
            {
              title: 'Publishing',
              fields: ['status', 'publishedAt', 'featured'],
              collapsible: true
            },
            {
              title: 'Organization', 
              fields: ['authorId', 'categoryId', 'tags']
            }
          ]
        },
        
        detail: {
          sections: [
            {
              title: 'Content',
              fields: ['title', 'content']
            },
            {
              title: 'Metadata',
              fields: ['status', 'publishedAt', 'viewCount', 'featured']
            },
            {
              title: 'Organization',
              fields: ['authorId', 'categoryId', 'tags']
            }
          ],
          actions: ['edit', 'delete', 'duplicate']
        }
      },
      
      permissions: {
        create: 'authenticated',
        read: 'public || status === "published"',
        update: 'user.id === entity.authorId || user.role === "admin"',
        delete: 'user.id === entity.authorId || user.role === "admin"'
      }
    }
  },

  views: {
    // Public blog views
    BlogHome: {
      type: 'list',
      route: '/',
      entity: 'Post',
      title: 'Latest Posts',
      filters: { status: 'published' }
    },
    
    BlogPost: {
      type: 'detail',
      route: '/post/:id',
      entity: 'Post'
    },
    
    BlogCategory: {
      type: 'list',
      route: '/category/:categoryId',
      entity: 'Post',
      title: 'Posts by Category'
    },

    // Admin views
    AdminDashboard: {
      type: 'list',
      route: '/admin',
      entity: 'Post',
      title: 'Content Management'
    },
    
    CreatePost: {
      type: 'form',
      route: '/admin/posts/new',
      entity: 'Post',
      mode: 'create',
      title: 'Create New Post'
    },
    
    EditPost: {
      type: 'form', 
      route: '/admin/posts/:id/edit',
      entity: 'Post',
      mode: 'edit',
      title: 'Edit Post'
    },

    AuthorManagement: {
      type: 'list',
      route: '/admin/authors',
      entity: 'Author',
      title: 'Manage Authors'
    },

    CategoryManagement: {
      type: 'list',
      route: '/admin/categories', 
      entity: 'Category',
      title: 'Manage Categories'
    }
  },

  workflows: {
    // Welcome new authors
    authorWelcome: {
      trigger: 'Author.created',
      description: 'Welcome new authors to the platform',
      actions: [
        {
          type: 'email',
          to: '${data.email}',
          subject: 'Welcome to BlogCMS!',
          message: 'Welcome ${data.name}! Your author account has been created.'
        }
      ]
    },

    // Notify when posts are published
    postPublished: {
      trigger: 'Post.published',
      description: 'Notify team when posts go live',
      actions: [
        {
          type: 'webhook',
          url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK',
          data: {
            text: '📝 New post published: ${data.title}',
            channel: '#content'
          }
        },
        {
          type: 'log',
          message: 'Post published: ${data.title} by ${data.authorId}'
        }
      ]
    },

    // Feature popular posts automatically
    autoFeature: {
      trigger: 'Post.updated',
      condition: 'viewCount > 1000 && !featured',
      description: 'Auto-feature posts with high view counts',
      actions: [
        {
          type: 'log',
          message: 'Auto-featuring popular post: ${data.title}'
        }
      ]
    }
  },

  settings: {
    auth: {
      enabled: true,
      provider: 'local',
      sessionTimeout: 1440
    },
    
    ui: {
      theme: 'light',
      layout: 'sidebar'
    }
  }
};