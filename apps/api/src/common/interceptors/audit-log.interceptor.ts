import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthenticatedUser } from '../../modules/identity/infrastructure/jwt/jwt.strategy';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * AuditLogInterceptor — writes an AuditLog entry for every state-changing
 * request (POST/PUT/PATCH/DELETE) that completes successfully.
 *
 * Auth events (login, register, logout) are also captured because the
 * AuthController methods call through this interceptor.
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method: string = request.method as string;

    if (!MUTATING_METHODS.has(method)) {
      return next.handle();
    }

    const user = request.user as AuthenticatedUser | undefined;
    const ip = (request.ip as string) ?? request.socket?.remoteAddress;
    const userAgent = request.headers['user-agent'] as string | undefined;
    const path: string = request.url as string;

    return next.handle().pipe(
      tap({
        next: () => {
          // Fire-and-forget — do not block the response
          this.prisma.auditLog
            .create({
              data: {
                actorUserId: user?.id ?? null,
                action: `${method} ${path}`,
                entityType: this.extractEntityType(path),
                entityId: this.extractEntityId(path, request.params),
                ipAddress: ip,
                userAgent,
              },
            })
            .catch((err: unknown) =>
              this.logger.error('Failed to write audit log', err),
            );
        },
        error: () => {
          // Don't log failed requests in the audit trail
        },
      }),
    );
  }

  private extractEntityType(path: string): string {
    // e.g. /api/v1/orders/123 → 'orders'
    const parts = path.split('/').filter(Boolean);
    return parts[2] ?? 'unknown';
  }

  private extractEntityId(
    path: string,
    params: Record<string, string>,
  ): string {
    return params?.['id'] ?? params?.['orderId'] ?? path;
  }
}
