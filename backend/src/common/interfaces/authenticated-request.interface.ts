import { Request } from 'express';

/**
 * User information attached to request after authentication
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Request interface with authenticated user information
 * Used in controllers that are protected by JwtAuthGuard
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}
