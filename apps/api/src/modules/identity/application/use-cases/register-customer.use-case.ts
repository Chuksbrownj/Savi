import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
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
import { RegisterCustomerDto } from '../dtos/auth.dto';
import { RegisterResponseDto } from '../dtos/auth-response.dto';
import { createTokenPair } from './token.helper';

@Injectable()
export class RegisterCustomerUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokens: IRefreshTokenRepository,
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async execute(dto: RegisterCustomerDto): Promise<RegisterResponseDto> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('email or phone is required');
    }

    // Check for existing user
    if (dto.email) {
      const existing = await this.users.findByEmail(dto.email);
      if (existing) throw new ConflictException('Email is already registered');
    }
    if (dto.phone) {
      const existing = await this.users.findByPhone(dto.phone);
      if (existing) throw new ConflictException('Phone is already registered');
    }

    const passwordObj = await Password.create(dto.password);

    // Transaction: create User + CustomerProfile
    const user = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.create({
        data: {
          email: dto.email,
          phone: dto.phone,
          passwordHash: passwordObj.hash,
          userType: 'Customer',
        },
      });
      await tx.customerProfile.create({ data: { userId: u.id } });
      return u;
    });

    const tokens = await createTokenPair(
      user,
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
