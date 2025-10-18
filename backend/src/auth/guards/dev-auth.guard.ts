import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Development Authentication Guard
 *
 * This guard bypasses JWT authentication in development mode and injects
 * a default user into the request object.
 *
 * IMPORTANT: This should ONLY be used in development environments.
 * In production, use JwtAuthGuard instead.
 *
 * Usage:
 * - Set NODE_ENV=development in your .env file
 * - The guard will automatically inject the dev user with ID: 00000000-0000-0000-0000-000000000001
 */
@Injectable()
export class DevAuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Inject the default development user
    request.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@example.com',
    };

    return true;
  }
}
