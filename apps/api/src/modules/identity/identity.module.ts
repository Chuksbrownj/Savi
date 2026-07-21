import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule } from '../../infrastructure/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

// Domain tokens
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { REFRESH_TOKEN_REPOSITORY } from './domain/repositories/refresh-token.repository.interface';

// Infrastructure
import { PrismaUserRepository } from './infrastructure/repositories/prisma-user.repository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/prisma-refresh-token.repository';
import { JwtStrategy } from './infrastructure/jwt/jwt.strategy';
import { RedisOtpStore } from './infrastructure/otp/redis-otp.store';
import { RealOtpSender } from './infrastructure/otp/real-otp-sender';
import { OTP_SENDER } from './infrastructure/otp/otp-sender.interface';

// Use Cases
import { RegisterCustomerUseCase } from './application/use-cases/register-customer.use-case';
import { RegisterBusinessUseCase } from './application/use-cases/register-business.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { LogoutAllUseCase } from './application/use-cases/logout-all.use-case';
import { RequestOtpUseCase } from './application/use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from './application/use-cases/verify-otp.use-case';
import { ForgotPasswordUseCase } from './application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from './application/use-cases/reset-password.use-case';

// Interface
import { AuthController } from './interface/controllers/auth.controller';
import { JwtAuthGuard } from './interface/guards/jwt-auth.guard';
import { RolesGuard } from './interface/guards/roles.guard';

/**
 * IdentityModule — Authentication, Authorization, and RBAC.
 *
 * Exports JwtAuthGuard and RolesGuard so AppModule can register them as
 * global guards via APP_GUARD.
 */
@Module({
  imports: [
    PrismaModule,
    forwardRef(() => NotificationsModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.get<string>('jwt.accessExpiresIn', '15m') as any,
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Repositories
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: PrismaRefreshTokenRepository,
    },

    // OTP infrastructure
    RedisOtpStore,
    { provide: OTP_SENDER, useClass: RealOtpSender },

    // JWT
    JwtStrategy,

    // Use Cases
    RegisterCustomerUseCase,
    RegisterBusinessUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    LogoutAllUseCase,
    RequestOtpUseCase,
    VerifyOtpUseCase,
    ForgotPasswordUseCase,
    ResetPasswordUseCase,

    // Guards (exported for global registration in AppModule)
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [JwtAuthGuard, RolesGuard, JwtModule],
})
export class IdentityModule {}
