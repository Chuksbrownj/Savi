import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsEnum } from 'class-validator';
import { DispatchTaskType } from '@prisma/client';

export class AssignDispatchDto {
  @ApiProperty()
  @IsString()
  riderId!: string;
}

export class AutoAssignDispatchDto {
  @ApiProperty()
  @IsString()
  orderId!: string;

  @ApiProperty({ enum: DispatchTaskType })
  @IsEnum(DispatchTaskType)
  type!: DispatchTaskType;
}
