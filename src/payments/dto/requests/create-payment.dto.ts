import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsDateString, IsString, IsEnum } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
import { BasePaymentDto, PaymentStatus } from '../base-payment.dto';

/**
 * 🎯 **CREATE PAYMENT DTO**
 * 
 * DTO for creating basic payments with contract linking.
 * Extends BasePaymentDto to inherit common payment fields and validation.
 * 
 * @extends BasePaymentDto
 * @author NestCMS Team
 * @version 3.0.0
 */
export class CreatePaymentDto extends BasePaymentDto {
  @ApiProperty({ 
    description: 'Contract ID to link payment to',
    example: '507f1f77bcf86cd799439011' 
  })
  @IsNotEmpty()
  @IsObjectId()
  readonly contractId: string;

  @ApiProperty({ 
    description: 'Payment title/name',
    example: 'Contract Payment #001' 
  })
  @IsNotEmpty()
  @IsString()
  readonly title: string;

  @ApiProperty({ 
    description: 'Payment content/details',
    example: 'Payment for web development services' 
  })
  @IsNotEmpty()
  @IsString()
  readonly content: string;

  @ApiProperty({ 
    description: 'Payment due date (ISO 8601)',
    example: '2024-12-31' 
  })
  @IsDateString()
  readonly date: string;

  @ApiPropertyOptional({ 
    description: 'Payment status',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING 
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  readonly status?: PaymentStatus = PaymentStatus.PENDING;
}
