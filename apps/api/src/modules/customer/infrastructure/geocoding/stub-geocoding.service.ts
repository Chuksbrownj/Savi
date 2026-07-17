import { Injectable, Logger } from '@nestjs/common';
import { IGeocodingService, Coordinates } from './geocoding.interface';

@Injectable()
export class StubGeocodingService implements IGeocodingService {
  private readonly logger = new Logger(StubGeocodingService.name);

  async getCoordinates(address: string): Promise<Coordinates | null> {
    this.logger.debug(`[STUB] Geocoding address: ${address}`);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Return dummy coordinates (Lagos, Nigeria approximate)
    return {
      lat: 6.5244 + (Math.random() * 0.01 - 0.005),
      lng: 3.3792 + (Math.random() * 0.01 - 0.005),
    };
  }
}
