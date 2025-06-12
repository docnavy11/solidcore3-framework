import { Hono } from 'https://deno.land/x/hono@v4.3.11/mod.ts';
import { cors } from 'https://deno.land/x/hono@v4.3.11/middleware/cors/index.ts';
import AuthService from './service.ts';
import AuthMiddleware from './middleware.ts';

export function createAuthRoutes(): Hono {
  const router = new Hono();
  const authService = new AuthService();
  const authMiddleware = new AuthMiddleware();

  // CORS for auth routes
  router.use('/*', cors({
    origin: '*', // Configure properly for production
    credentials: true,
    allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  /**
   * POST /auth/register - Register a new user
   */
  router.post('/register', async (c) => {
    try {
      const body = await c.req.json();
      const { email, password, name, role } = body;

      // Validate required fields
      if (!email || !password || !name) {
        return c.json({
          success: false,
          error: 'Email, password, and name are required'
        }, 400);
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return c.json({
          success: false,
          error: 'Invalid email format'
        }, 400);
      }

      // Password strength validation
      if (password.length < 6) {
        return c.json({
          success: false,
          error: 'Password must be at least 6 characters long'
        }, 400);
      }

      const result = await authService.register({
        email,
        password,
        name,
        role: role || 'user' // Default to 'user' role
      });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error
        }, 400);
      }

      // Set auth cookie if token generation succeeded
      if (result.tokens) {
        c.cookie('auth_token', result.tokens.accessToken, {
          httpOnly: true,
          secure: false, // Set to true in production with HTTPS
          sameSite: 'lax',
          maxAge: result.tokens.expiresIn,
          path: '/'
        });
      }

      return c.json({
        success: true,
        user: result.user,
        tokens: result.tokens
      }, 201);

    } catch (error) {
      console.error('Registration error:', error);
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500);
    }
  });

  /**
   * POST /auth/login - Login with email and password
   */
  router.post('/login', async (c) => {
    try {
      const body = await c.req.json();
      const { email, password } = body;

      // Validate required fields
      if (!email || !password) {
        return c.json({
          success: false,
          error: 'Email and password are required'
        }, 400);
      }

      const result = await authService.login({ email, password });

      if (!result.success) {
        return c.json({
          success: false,
          error: result.error
        }, 401);
      }

      // Set auth cookie if login succeeded
      if (result.tokens) {
        c.cookie('auth_token', result.tokens.accessToken, {
          httpOnly: true,
          secure: false, // Set to true in production with HTTPS
          sameSite: 'lax',
          maxAge: result.tokens.expiresIn,
          path: '/'
        });
      }

      return c.json({
        success: true,
        user: result.user,
        tokens: result.tokens
      });

    } catch (error) {
      console.error('Login error:', error);
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500);
    }
  });

  /**
   * POST /auth/logout - Logout (clear token)
   */
  router.post('/logout', authMiddleware.authenticate(), async (c) => {
    // Clear the auth cookie
    c.cookie('auth_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0, // Expire immediately
      path: '/'
    });

    return c.json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  /**
   * GET /auth/me - Get current user information
   */
  router.get('/me', authMiddleware.authenticate(), async (c) => {
    const auth = AuthMiddleware.getAuthContext(c);

    if (!auth.authenticated) {
      return c.json({
        success: false,
        error: 'Not authenticated'
      }, 401);
    }

    return c.json({
      success: true,
      user: auth.user
    });
  });

  /**
   * PUT /auth/me - Update current user information
   */
  router.put('/me', authMiddleware.authenticate(), authMiddleware.requireAuth(), async (c) => {
    try {
      const currentUser = AuthMiddleware.getCurrentUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          error: 'User not found'
        }, 404);
      }

      const body = await c.req.json();
      const { name, email } = body;

      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;

      if (Object.keys(updates).length === 0) {
        return c.json({
          success: false,
          error: 'No valid fields to update'
        }, 400);
      }

      const updatedUser = await authService.updateUser(currentUser.id, updates);

      if (!updatedUser) {
        return c.json({
          success: false,
          error: 'Failed to update user'
        }, 500);
      }

      return c.json({
        success: true,
        user: updatedUser
      });

    } catch (error) {
      console.error('User update error:', error);
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500);
    }
  });

  /**
   * PUT /auth/password - Change password
   */
  router.put('/password', authMiddleware.authenticate(), authMiddleware.requireAuth(), async (c) => {
    try {
      const currentUser = AuthMiddleware.getCurrentUser(c);
      if (!currentUser) {
        return c.json({
          success: false,
          error: 'User not found'
        }, 404);
      }

      const body = await c.req.json();
      const { currentPassword, newPassword } = body;

      if (!currentPassword || !newPassword) {
        return c.json({
          success: false,
          error: 'Current password and new password are required'
        }, 400);
      }

      if (newPassword.length < 6) {
        return c.json({
          success: false,
          error: 'New password must be at least 6 characters long'
        }, 400);
      }

      const success = await authService.changePassword(
        currentUser.id,
        currentPassword,
        newPassword
      );

      if (!success) {
        return c.json({
          success: false,
          error: 'Failed to change password. Current password may be incorrect.'
        }, 400);
      }

      return c.json({
        success: true,
        message: 'Password changed successfully'
      });

    } catch (error) {
      console.error('Password change error:', error);
      return c.json({
        success: false,
        error: 'Internal server error'
      }, 500);
    }
  });

  /**
   * GET /auth/status - Check authentication status
   */
  router.get('/status', authMiddleware.authenticate(), async (c) => {
    const auth = AuthMiddleware.getAuthContext(c);

    return c.json({
      authenticated: auth.authenticated,
      user: auth.user || null
    });
  });

  // Admin-only routes

  /**
   * GET /auth/users - List all users (admin only)
   */
  router.get('/users', 
    authMiddleware.authenticate(), 
    authMiddleware.requireRole('admin'), 
    async (c) => {
      try {
        const authService = new AuthService();
        const db = authService['db']; // Access the database through service

        const result = await db.execute(
          'SELECT id, email, name, role, is_active, created_at, last_login_at FROM user ORDER BY created_at DESC'
        );

        const users = (result.rows || []).map((row: any) => ({
          id: row.id,
          email: row.email,
          name: row.name,
          role: row.role,
          isActive: row.is_active === 1,
          createdAt: row.created_at,
          lastLoginAt: row.last_login_at
        }));

        return c.json({
          success: true,
          users
        });

      } catch (error) {
        console.error('List users error:', error);
        return c.json({
          success: false,
          error: 'Internal server error'
        }, 500);
      }
    }
  );

  /**
   * PUT /auth/users/:id/role - Update user role (admin only)
   */
  router.put('/users/:id/role', 
    authMiddleware.authenticate(), 
    authMiddleware.requireRole('admin'), 
    async (c) => {
      try {
        const userId = c.req.param('id');
        const body = await c.req.json();
        const { role } = body;

        if (!role || !['admin', 'manager', 'user'].includes(role)) {
          return c.json({
            success: false,
            error: 'Invalid role. Must be admin, manager, or user.'
          }, 400);
        }

        const updatedUser = await authService.updateUser(userId, { role });

        if (!updatedUser) {
          return c.json({
            success: false,
            error: 'User not found or update failed'
          }, 404);
        }

        return c.json({
          success: true,
          user: updatedUser
        });

      } catch (error) {
        console.error('Update user role error:', error);
        return c.json({
          success: false,
          error: 'Internal server error'
        }, 500);
      }
    }
  );

  /**
   * PUT /auth/users/:id/status - Activate/deactivate user (admin only)
   */
  router.put('/users/:id/status', 
    authMiddleware.authenticate(), 
    authMiddleware.requireRole('admin'), 
    async (c) => {
      try {
        const userId = c.req.param('id');
        const body = await c.req.json();
        const { isActive } = body;

        if (typeof isActive !== 'boolean') {
          return c.json({
            success: false,
            error: 'isActive must be a boolean value'
          }, 400);
        }

        const success = isActive 
          ? await authService.activateUser(userId)
          : await authService.deactivateUser(userId);

        if (!success) {
          return c.json({
            success: false,
            error: 'User not found or update failed'
          }, 404);
        }

        return c.json({
          success: true,
          message: `User ${isActive ? 'activated' : 'deactivated'} successfully`
        });

      } catch (error) {
        console.error('Update user status error:', error);
        return c.json({
          success: false,
          error: 'Internal server error'
        }, 500);
      }
    }
  );

  return router;
}

export { createAuthRoutes as default };