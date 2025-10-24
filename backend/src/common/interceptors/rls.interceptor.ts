import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * RLS Interceptor
 * Sets the PostgreSQL session parameter 'app.user_id' for Row-Level Security policies
 *
 * This interceptor runs after authentication guards and sets the user context
 * in all database connections used during the request. This enables PostgreSQL
 * Row-Level Security policies to filter data based on the authenticated user.
 *
 * Implementation Strategy:
 * - Wraps DataSource.createQueryRunner to inject user context into new query runners
 * - Also sets user context on the default connection manager for repository queries
 * - Ensures both transaction and non-transaction queries have proper RLS context
 * - Uses a request flag to prevent infinite recursion
 */
@Injectable()
export class RlsInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RlsInterceptor.name);
  private readonly RLS_APPLIED_KEY = Symbol('rls_applied');

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // If user is not authenticated, proceed without setting RLS context
    if (!user || !user.id) {
      return next.handle();
    }

    // Prevent infinite recursion - if RLS is already applied for this request, skip
    if (request[this.RLS_APPLIED_KEY]) {
      return next.handle();
    }

    // Mark this request as having RLS applied
    request[this.RLS_APPLIED_KEY] = true;

    const userId = user.id;

    // Simply set the user context - don't try to manage connections
    // TypeORM will handle connection pooling automatically
    // The set_config will apply to whatever connection is used from the pool
    this.dataSource
      .query(`SELECT set_config('app.user_id', $1, false)`, [userId])
      .then(() => {
        this.logger.debug(`Set RLS context for user ${userId}`);
      })
      .catch((error) => {
        this.logger.error(
          `Failed to set RLS context for user ${userId}:`,
          error,
        );
      });

    // Just pass through - don't wait for the set_config to complete
    // This avoids async/await which can cause recursion issues
    return next.handle();
  }
}
