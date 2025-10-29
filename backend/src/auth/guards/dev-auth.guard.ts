import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

/**
 * User information injected into request
 */
interface DevUser {
  id: string;
  email: string;
}

/**
 * Request with user property
 */
interface RequestWithUser extends Request {
  user: DevUser;
}

/**
 * Development Authentication Guard
 *
 * This guard bypasses JWT authentication in development mode and injects
 * a default user into the request object.
 *
 * ⚠️ DEPRECATED: This guard is no longer needed as JWT authentication is now implemented.
 * All controllers should use JwtAuthGuard instead.
 *
 * IMPORTANT: This guard will throw an error in production to prevent accidental usage.
 *
 * Usage:
 * - Set NODE_ENV=development in your .env file
 * - The guard will automatically inject the dev user with ID: 00000000-0000-0000-0000-000000000001
 * - DO NOT use this guard in new code - use JwtAuthGuard instead
 */
@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    // Prevent usage in production
    const nodeEnv = this.configService.get<string>('NODE_ENV');
    if (nodeEnv === 'production') {
      throw new ForbiddenException(
        'DevAuthGuard cannot be used in production! Use JwtAuthGuard instead.',
      );
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();

    // Inject the default development user
    request.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@example.com',
    };

    return true;
  }
}
