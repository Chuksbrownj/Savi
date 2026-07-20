import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  DISPATCH_REPOSITORY,
  IDispatchRepository,
} from '../../domain/repositories/dispatch.repository.interface';

@Injectable()
export class GetRiderEarningsUseCase {
  constructor(
    @Inject(DISPATCH_REPOSITORY)
    private readonly dispatchRepository: IDispatchRepository,
  ) {}

  async execute(userId: string) {
    const profile =
      await this.dispatchRepository.getRiderProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Dispatch rider profile not found');
    }

    return this.dispatchRepository.getEarnings(profile.id);
  }
}
