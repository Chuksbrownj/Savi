import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ReportIssueDto {
  @ApiProperty({ description: 'Description of the issue encountered' })
  @IsString()
  @IsNotEmpty()
  description!: string;
}
