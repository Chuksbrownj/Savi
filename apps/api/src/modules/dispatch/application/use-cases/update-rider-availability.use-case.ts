import {
  Inject,
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  DISPATCH_REPOSITORY,
  IDispatchRepository,
} from '../../domain/repositories/dispatch.repository.interface';
import { RiderAvailability } from '@prisma/client';

@Injectable()
export class UpdateRiderAvailabilityUseCase {
  constructor(
    @Inject(DISPATCH_REPOSITORY)
    private readonly dispatchRepository: IDispatchRepository,
  ) {}

  async execute(userId: string, availability: RiderAvailability) {
    const profile =
      await this.dispatchRepository.getRiderProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Dispatch rider profile not found');
    }

    if (
      profile.availability === RiderAvailability.OnJob &&
      availability === RiderAvailability.Offline
    ) {
      throw new ConflictException('Cannot go offline while on a job');
    }

    return this.dispatchRepository.updateRiderAvailability(
      profile.id,
      availability,
    );
  }
}
