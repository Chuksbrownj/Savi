import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import {
  IRefreshTokenRepository,
  REFRESH_TOKEN_REPOSITORY,
} from '../../domain/repositories/refresh-token.repository.interface';
import { Password } from '../../domain/value-objects/password.value-object';
import { LoginDto } from '../dtos/auth.dto';
import { LoginResponseDto } from '../dtos/auth-response.dto';
import { createTokenPair } from './token.helper';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(dto: LoginDto): Promise<LoginResponseDto> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('email or phone is required');
    }

    const user = dto.email
      ? await this.users.findByEmail(dto.email)
      : await this.users.findByPhone(dto.phone!);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const pwd = Password.fromHash(user.passwordHash);
    const valid = await pwd.verify(dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.users.update(user.id, { lastLoginAt: new Date() });

    // Fetch staff profile for RBAC payload (if applicable)
    const userWithProfile = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { staffProfile: true },
    });

    const tokens = await createTokenPair(
      userWithProfile!,
      this.jwt,
      this.config,
      this.refreshTokens,
    );

    return {
      user: {
        id: user.id,
        userType: user.userType,
        email: user.email ?? undefined,
        phone: user.phone ?? undefined,
      },
      tokens,
    };
  }
}
