import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../infrastructure/prisma/prisma.service';

export interface JwtPayload {
  sub: string;
  userType: string;
  roleId: string | null;
  businessId: string | null;
  branchId: string | null;
  iat?: number;
  exp?: number;
}

export interface AuthenticatedUser {
  id: string;
  userType: string;
  roleId: string | null;
  businessId: string | null;
  branchId: string | null;
}

/**
 * JwtStrategy — validates Bearer tokens extracted from Authorization header.
 * On success, attaches an AuthenticatedUser object to request.user.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is not active');
    }

    return {
      id: payload.sub,
      userType: payload.userType,
      roleId: payload.roleId,
      businessId: payload.businessId,
      branchId: payload.branchId,
    };
  }
}
