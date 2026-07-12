import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { PaginationMeta } from '../../modules/shared-kernel/domain/value-objects';

export interface SuccessResponse<T> {
  data: T;
  meta?: PaginationMeta | Record<string, unknown>;
}

/**
 * Global response interceptor.
 * Wraps all successful responses in a consistent { data, meta } envelope.
 */
@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        // If data already has the { data, meta } shape, pass it through
        if (
          data !== null &&
          typeof data === 'object' &&
          'data' in (data as object) &&
          Object.keys(data as object).every((k) => ['data', 'meta'].includes(k))
        ) {
          return data as unknown as SuccessResponse<T>;
        }
        return { data };
      }),
    );
  }
}
