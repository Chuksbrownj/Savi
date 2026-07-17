import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../domain/repositories/user.repository.interface';
import { OtpRequestDto } from '../dtos/auth.dto';
import { RedisOtpStore } from '../../infrastructure/otp/redis-otp.store';
import {
  IOtpSender,
  OTP_SENDER,
} from '../../infrastructure/otp/otp-sender.interface';

@Injectable()
export class RequestOtpUseCase {
  private readonly logger = new Logger(RequestOtpUseCase.name);

  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    private readonly otpStore: RedisOtpStore,
    @Inject(OTP_SENDER) private readonly otpSender: IOtpSender,
  ) {}

  async execute(dto: OtpRequestDto): Promise<{ message: string }> {
    if (!dto.email && !dto.phone) {
      throw new BadRequestException('email or phone is required');
    }

    const identifier = dto.email ?? dto.phone!;

    // Validate user exists
    const user = dto.email
      ? await this.users.findByEmail(dto.email)
      : await this.users.findByPhone(dto.phone!);

    if (!user) {
      // Return a generic message to prevent user enumeration
      return { message: 'If your account exists, an OTP has been sent.' };
    }

    // Generate 6-digit OTP
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store hashed OTP in Redis (5 minute TTL)
    await this.otpStore.set(identifier, code, 300);

    // Send via stub provider
    await this.otpSender.send(identifier, code);

    this.logger.log(
      `OTP requested for identifier (masked): ${identifier.slice(0, 4)}***`,
    );

    return { message: 'If your account exists, an OTP has been sent.' };
  }
}
