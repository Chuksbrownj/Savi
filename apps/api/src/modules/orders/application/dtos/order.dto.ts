import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsArray,
  ValidateNested,
  IsOptional,
  Min,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  serviceId!: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @ApiProperty()
  @IsString()
  businessId!: string;

  @ApiProperty()
  @IsString()
  branchId!: string;

  @ApiProperty()
  @IsString()
  scheduledPickupAt!: string;

  @ApiProperty()
  @IsString()
  pickupAddressId!: string;

  @ApiProperty()
  @IsString()
  deliveryAddressId!: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  specialInstructions?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isExpress?: boolean;
}

export class ApplyPromotionDto {
  @ApiProperty()
  @IsString()
  code!: string;
}

export class SelectPaymentMethodDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiPropertyOptional({
    description:
      'Percentage if paying part. Must be >= minPartialPaymentPercent of the business',
  })
  @IsOptional()
  @IsNumber()
  partialPaymentPercent?: number;
}

export class RateOrderDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  rating!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  review?: string;
}
