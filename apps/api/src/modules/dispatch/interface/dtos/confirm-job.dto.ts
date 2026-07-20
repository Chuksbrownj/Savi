import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class ConfirmJobDto {
  @ApiProperty({ description: 'URL of the uploaded proof image' })
  @IsUrl()
  @IsNotEmpty()
  imageUrl!: string;

  @ApiPropertyOptional({ description: 'URL of the customer signature image' })
  @IsUrl()
  @IsOptional()
  signatureUrl?: string;

  @ApiPropertyOptional({
    description: 'Name of the person who received the items (for delivery)',
  })
  @IsString()
  @IsOptional()
  recipientName?: string;

  @ApiPropertyOptional({ description: 'Any additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
