import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RejectJobDto {
  @ApiProperty({ description: 'Reason for rejecting the job' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
