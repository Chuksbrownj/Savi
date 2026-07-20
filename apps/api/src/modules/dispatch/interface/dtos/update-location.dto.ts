import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, Max } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ description: 'Latitude', example: 6.5244 })
  @IsNumber()
  @Max(90)
  @IsNotEmpty()
  lat!: number;

  @ApiProperty({ description: 'Longitude', example: 3.3792 })
  @IsNumber()
  @Max(180)
  @IsNotEmpty()
  lng!: number;
}
