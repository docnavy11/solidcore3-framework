import { Context, Next } from 'https://deno.land/x/hono@v4.3.11/mod.ts';
import { verify } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { getDatabase } from '../database/client.ts';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
}

export interface AuthContext {
  user?: AuthUser;
  authenticated: boolean;
}

// JWT Secret - In production, this should come from environment variables
const JWT_SECRET = Deno.env.get('JWT_SECRET') || 'your-secret-key-change-in-production';

export class AuthMiddleware {
  private secretKey: CryptoKey | null = null;

  constructor() {
    this.initializeSecretKey();
  }

  private async initializeSecretKey() {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(JWT_SECRET);
    this.secretKey = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
  }

  private async getSecretKey(): Promise<CryptoKey> {
    if (!this.secretKey) {
      await this.initializeSecretKey();
    }
    return this.secretKey!;
  }

  /**
   * Middleware to extract and verify JWT tokens from requests
   */
  async authenticate() {
    return async (c: Context, next: Next) => {
      const authHeader = c.req.header('authorization');
      let token: string | null = null;

      // Extract token from Authorization header or cookie
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      } else {
        // Try to get token from cookie as fallback
        token = c.req.cookie('auth_token') || null;
      }

      const authContext: AuthContext = {
        authenticated: false,
      };

      if (token) {
        try {
          const secretKey = await this.getSecretKey();
          const payload = await verify(token, secretKey);
          
          // Verify the token payload has required fields
          if (payload.sub && payload.email && payload.role) {
            // Fetch fresh user data to ensure user is still active
            const db = getDatabase();
            const result = await db.execute(
              'SELECT id, email, name, role, is_active FROM user WHERE id = ? AND is_active = 1',
              [payload.sub]
            );

            if (result.rows && result.rows.length > 0) {
              const userData = result.rows[0] as any;
              authContext.user = {
                id: userData.id,
                email: userData.email,
                name: userData.name,
                role: userData.role,
                isActive: userData.is_active === 1,
              };
              authContext.authenticated = true;
            }
          }
        } catch (error) {
          console.warn('Invalid JWT token:', error.message);
          // Token is invalid, continue with unauthenticated request
        }
      }

      // Set auth context on the request context
      c.set('auth', authContext);

      await next();
    };
  }

  /**
   * Middleware to require authentication
   */
  requireAuth() {
    return async (c: Context, next: Next) => {
      const auth = c.get('auth') as AuthContext;
      
      if (!auth?.authenticated) {
        return c.json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        }, 401);
      }

      await next();
    };
  }

  /**
   * Middleware to require specific roles
   */
  requireRole(roles: string | string[]) {
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    
    return async (c: Context, next: Next) => {
      const auth = c.get('auth') as AuthContext;
      
      if (!auth?.authenticated) {
        return c.json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        }, 401);
      }

      if (!auth.user || !requiredRoles.includes(auth.user.role)) {
        return c.json({ 
          error: 'Insufficient permissions',
          code: 'FORBIDDEN',
          required: requiredRoles,
          current: auth.user?.role
        }, 403);
      }

      await next();
    };
  }

  /**
   * Get auth context from request
   */
  static getAuthContext(c: Context): AuthContext {
    return c.get('auth') as AuthContext || { authenticated: false };
  }

  /**
   * Get current user from request
   */
  static getCurrentUser(c: Context): AuthUser | null {
    const auth = c.get('auth') as AuthContext;
    return auth?.user || null;
  }
}

export { AuthMiddleware as default };