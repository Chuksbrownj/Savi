import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserType } from '@prisma/client';

export class TokenPairDto {
  @ApiProperty()
  accessToken!: string;

  @ApiProperty()
  refreshToken!: string;
}

export class AuthUserDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: UserType })
  userType!: UserType;

  @ApiPropertyOptional()
  email?: string;

  @ApiPropertyOptional()
  phone?: string;
}

export class RegisterResponseDto {
  @ApiProperty()
  user!: AuthUserDto;

  @ApiProperty()
  tokens!: TokenPairDto;
}

export class LoginResponseDto {
  @ApiProperty()
  user!: AuthUserDto;

  @ApiProperty()
  tokens!: TokenPairDto;
}
