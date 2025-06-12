import { create, getNumericDate } from 'https://deno.land/x/djwt@v3.0.2/mod.ts';
import { hash, compare as verifyPassword } from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';
import { getDatabase } from '../database/client.ts';
import { AuthUser } from './middleware.ts';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn: number;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  tokens?: AuthTokens;
  error?: string;
}

// JWT Secret - MUST be set in production
const JWT_SECRET = Deno.env.get('JWT_SECRET');
const JWT_EXPIRES_IN = Deno.env.get('JWT_EXPIRES_IN') || '24h'; // 24 hours

// Validate JWT secret in production
if (!JWT_SECRET) {
  if (Deno.env.get('DENO_ENV') === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  console.warn('⚠️  Using default JWT secret in development - NEVER use this in production!');
}

const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-only-secret-key-never-use-in-production';

export class AuthService {
  private secretKey: CryptoKey | null = null;
  private db: any;

  constructor() {
    this.db = getDatabase();
    this.initializeSecretKey();
  }

  private async initializeSecretKey() {
    const encoder = new TextEncoder();
    const keyMaterial = encoder.encode(EFFECTIVE_JWT_SECRET);
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
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    try {
      // Check if user already exists
      const existingUser = await this.db.execute(
        'SELECT id FROM user WHERE email = ?',
        [data.email]
      );

      if (existingUser.rows && existingUser.rows.length > 0) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Hash password
      const hashedPassword = await hash(data.password);

      // Create user
      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      await this.db.execute(
        `INSERT INTO user (id, email, password, name, role, is_active, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          data.email,
          hashedPassword,
          data.name,
          data.role || 'user',
          true,
          now,
          now
        ]
      );

      // Fetch the created user
      const newUser = await this.getUserById(userId);
      if (!newUser) {
        return {
          success: false,
          error: 'Failed to create user'
        };
      }

      // Generate tokens
      const tokens = await this.generateTokens(newUser);

      return {
        success: true,
        user: newUser,
        tokens
      };

    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'Registration failed'
      };
    }
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResult> {
    try {
      // Find user by email
      const result = await this.db.execute(
        'SELECT id, email, password, name, role, is_active FROM user WHERE email = ?',
        [credentials.email]
      );

      if (!result.rows || result.rows.length === 0) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      const userData = result.rows[0] as any;

      // Check if user is active
      if (!userData.is_active) {
        return {
          success: false,
          error: 'Account is deactivated'
        };
      }

      // Verify password
      const passwordValid = await verifyPassword(credentials.password, userData.password);
      if (!passwordValid) {
        return {
          success: false,
          error: 'Invalid email or password'
        };
      }

      // Update last login time
      await this.db.execute(
        'UPDATE user SET last_login_at = ? WHERE id = ?',
        [new Date().toISOString(), userData.id]
      );

      // Create user object (without password)
      const user: AuthUser = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: userData.is_active === 1
      };

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return {
        success: true,
        user,
        tokens
      };

    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Login failed'
      };
    }
  }

  /**
   * Generate JWT tokens for a user
   */
  private async generateTokens(user: AuthUser): Promise<AuthTokens> {
    const now = Math.floor(Date.now() / 1000);
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds

    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      iat: now,
      exp: now + expiresIn,
    };

    const secretKey = await this.getSecretKey();
    const accessToken = await create(
      { alg: 'HS256', typ: 'JWT' },
      payload,
      secretKey
    );

    return {
      accessToken,
      expiresIn
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<AuthUser | null> {
    try {
      const result = await this.db.execute(
        'SELECT id, email, name, role, is_active FROM user WHERE id = ?',
        [id]
      );

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      const userData = result.rows[0] as any;
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: userData.is_active === 1
      };

    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<AuthUser | null> {
    try {
      const result = await this.db.execute(
        'SELECT id, email, name, role, is_active FROM user WHERE email = ?',
        [email]
      );

      if (!result.rows || result.rows.length === 0) {
        return null;
      }

      const userData = result.rows[0] as any;
      return {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        isActive: userData.is_active === 1
      };

    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  /**
   * Update user information
   */
  async updateUser(id: string, updates: Partial<AuthUser>): Promise<AuthUser | null> {
    try {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.name !== undefined) {
        fields.push('name = ?');
        values.push(updates.name);
      }

      if (updates.email !== undefined) {
        fields.push('email = ?');
        values.push(updates.email);
      }

      if (updates.role !== undefined) {
        fields.push('role = ?');
        values.push(updates.role);
      }

      if (updates.isActive !== undefined) {
        fields.push('is_active = ?');
        values.push(updates.isActive ? 1 : 0);
      }

      if (fields.length === 0) {
        return this.getUserById(id);
      }

      // Add updated_at timestamp
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());

      // Add ID for WHERE clause
      values.push(id);

      await this.db.execute(
        `UPDATE user SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return this.getUserById(id);

    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      // Get current user with password
      const result = await this.db.execute(
        'SELECT password FROM user WHERE id = ?',
        [id]
      );

      if (!result.rows || result.rows.length === 0) {
        return false;
      }

      const userData = result.rows[0] as any;

      // Verify current password
      const passwordValid = await verifyPassword(currentPassword, userData.password);
      if (!passwordValid) {
        return false;
      }

      // Hash new password
      const hashedPassword = await hash(newPassword);

      // Update password
      await this.db.execute(
        'UPDATE user SET password = ?, updated_at = ? WHERE id = ?',
        [hashedPassword, new Date().toISOString(), id]
      );

      return true;

    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(id: string): Promise<boolean> {
    try {
      await this.db.execute(
        'UPDATE user SET is_active = 0, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), id]
      );
      return true;
    } catch (error) {
      console.error('Error deactivating user:', error);
      return false;
    }
  }

  /**
   * Activate user account
   */
  async activateUser(id: string): Promise<boolean> {
    try {
      await this.db.execute(
        'UPDATE user SET is_active = 1, updated_at = ? WHERE id = ?',
        [new Date().toISOString(), id]
      );
      return true;
    } catch (error) {
      console.error('Error activating user:', error);
      return false;
    }
  }
}

export { AuthService as default };