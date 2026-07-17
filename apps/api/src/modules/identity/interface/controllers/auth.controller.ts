import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { Public } from '../decorators/public.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { AuthenticatedUser } from '../../infrastructure/jwt/jwt.strategy';

import { RegisterCustomerUseCase } from '../../application/use-cases/register-customer.use-case';
import { RegisterBusinessUseCase } from '../../application/use-cases/register-business.use-case';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { LogoutAllUseCase } from '../../application/use-cases/logout-all.use-case';
import { RequestOtpUseCase } from '../../application/use-cases/request-otp.use-case';
import { VerifyOtpUseCase } from '../../application/use-cases/verify-otp.use-case';
import { ForgotPasswordUseCase } from '../../application/use-cases/forgot-password.use-case';
import { ResetPasswordUseCase } from '../../application/use-cases/reset-password.use-case';

import {
  RegisterCustomerDto,
  RegisterBusinessDto,
  LoginDto,
  RefreshTokenDto,
  OtpRequestDto,
  OtpVerifyDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from '../../application/dtos/auth.dto';
import {
  RegisterResponseDto,
  LoginResponseDto,
  TokenPairDto,
} from '../../application/dtos/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerCustomer: RegisterCustomerUseCase,
    private readonly registerBusiness: RegisterBusinessUseCase,
    private readonly login: LoginUseCase,
    private readonly refreshToken: RefreshTokenUseCase,
    private readonly logout: LogoutUseCase,
    private readonly logoutAll: LogoutAllUseCase,
    private readonly requestOtp: RequestOtpUseCase,
    private readonly verifyOtp: VerifyOtpUseCase,
    private readonly forgotPassword: ForgotPasswordUseCase,
    private readonly resetPassword: ResetPasswordUseCase,
  ) {}

  // ─── Registration ──────────────────────────────────────────────────────────

  @Public()
  @Post('register/customer')
  @Throttle({ default: { limit: 10, ttl: 3600 } })
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, type: RegisterResponseDto })
  async registerCustomerHandler(
    @Body() dto: RegisterCustomerDto,
  ): Promise<RegisterResponseDto> {
    return this.registerCustomer.execute(dto);
  }

  @Public()
  @Post('register/business')
  @Throttle({ default: { limit: 10, ttl: 3600 } })
  @ApiOperation({ summary: 'Register a new business owner account' })
  @ApiResponse({ status: 201, type: RegisterResponseDto })
  async registerBusinessHandler(
    @Body() dto: RegisterBusinessDto,
  ): Promise<RegisterResponseDto> {
    return this.registerBusiness.execute(dto);
  }

  // ─── Login / Refresh / Logout ───────────────────────────────────────────────

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60 } })
  @ApiOperation({ summary: 'Login with email/phone + password' })
  @ApiResponse({ status: 200, type: LoginResponseDto })
  async loginHandler(@Body() dto: LoginDto): Promise<LoginResponseDto> {
    return this.login.execute(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange a valid refresh token for a new token pair',
  })
  @ApiResponse({ status: 200, type: TokenPairDto })
  async refreshHandler(@Body() dto: RefreshTokenDto): Promise<TokenPairDto> {
    return this.refreshToken.execute(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Revoke the current refresh token (logout)' })
  async logoutHandler(
    @Body() dto: RefreshTokenDto,
  ): Promise<{ message: string }> {
    await this.logout.execute(dto.refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Revoke all refresh tokens for this user (logout everywhere)',
  })
  async logoutAllHandler(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ message: string }> {
    await this.logoutAll.execute(user.id);
    return { message: 'All sessions terminated' };
  }

  // ─── OTP Verification ──────────────────────────────────────────────────────

  @Public()
  @Post('otp/request')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @ApiOperation({ summary: 'Request an OTP code to verify email or phone' })
  async otpRequestHandler(
    @Body() dto: OtpRequestDto,
  ): Promise<{ message: string }> {
    return this.requestOtp.execute(dto);
  }

  @Public()
  @Post('otp/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify an OTP code' })
  async otpVerifyHandler(
    @Body() dto: OtpVerifyDto,
  ): Promise<{ message: string }> {
    return this.verifyOtp.execute(dto);
  }

  // ─── Password Reset ─────────────────────────────────────────────────────────

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 3600 } })
  @ApiOperation({ summary: 'Request a password reset token' })
  async forgotPasswordHandler(
    @Body() dto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.forgotPassword.execute(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password using a valid reset token' })
  async resetPasswordHandler(
    @Body() dto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.resetPassword.execute(dto, dto.identifier);
  }
}
