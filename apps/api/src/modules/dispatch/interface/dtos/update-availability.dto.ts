import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { RiderAvailability } from '@prisma/client';

export class UpdateAvailabilityDto {
  @ApiProperty({
    description: 'New availability status',
    enum: RiderAvailability,
    example: RiderAvailability.Online,
  })
  @IsEnum(RiderAvailability)
  @IsNotEmpty()
  status!: RiderAvailability;
}
