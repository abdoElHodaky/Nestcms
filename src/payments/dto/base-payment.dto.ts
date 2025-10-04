/**
 * 🎯 **BASE PAYMENT DTO**
 * 
 * Base DTO class containing common payment fields and validation.
 * All other payment DTOs should extend this base class to ensure consistency
 * and eliminate field duplication.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  IsString, 
  IsEnum, 
  IsObject, 
  Min, 
  Max, 
  Length,
  IsEmail,
  IsPhoneNumber,
  ValidateNested,
  IsUrl,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

// ============================================================================
// ENUMS
// ============================================================================

export enum PaymentCurrency {
  USD = 'USD',
  EUR = 'EUR',
  SAR = 'SAR',
  AED = 'AED',
  KWD = 'KWD',
  BHD = 'BHD',
  QAR = 'QAR',
  OMR = 'OMR',
  EGP = 'EGP',
  JOD = 'JOD',
}

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
  APPLE_PAY = 'apple_pay',
  GOOGLE_PAY = 'google_pay',
  SAMSUNG_PAY = 'samsung_pay',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  REFUNDED = 'refunded',
}

export enum PaymentPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// ============================================================================
// NESTED DTOs
// ============================================================================

export class ClientInfoDto {
  @ApiProperty({ description: 'Client full name', example: 'John Doe' })
  @IsNotEmpty()
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ description: 'Client email address', example: 'john.doe@example.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Client phone number', example: '+966501234567' })
  @IsNotEmpty()
  @IsString()
  @Length(10, 20)
  phone: string;

  @ApiPropertyOptional({ description: 'Client address information' })
  @IsOptional()
  @IsObject()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
}

export class PaymentMetadataDto {
  @ApiPropertyOptional({ description: 'Order ID or reference' })
  @IsOptional()
  @IsString()
  orderId?: string;

  @ApiPropertyOptional({ description: 'Invoice number' })
  @IsOptional()
  @IsString()
  invoiceNumber?: string;

  @ApiPropertyOptional({ description: 'Customer reference' })
  @IsOptional()
  @IsString()
  customerRef?: string;

  @ApiPropertyOptional({ description: 'Additional custom fields' })
  @IsOptional()
  @IsObject()
  customFields?: Record<string, any>;
}

// ============================================================================
// BASE PAYMENT DTO
// ============================================================================

export abstract class BasePaymentDto {
  @ApiProperty({ 
    description: 'Payment amount', 
    example: 100.50,
    minimum: 0.01,
    maximum: 999999.99 
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(999999.99)
  @Transform(({ value }) => parseFloat(value))
  amount: number;

  @ApiProperty({ 
    description: 'Payment currency', 
    enum: PaymentCurrency,
    example: PaymentCurrency.SAR 
  })
  @IsNotEmpty()
  @IsEnum(PaymentCurrency)
  currency: PaymentCurrency;

  @ApiPropertyOptional({ 
    description: 'Payment description', 
    example: 'Payment for order #12345',
    maxLength: 500 
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiProperty({ 
    description: 'Client information',
    type: ClientInfoDto 
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ClientInfoDto)
  clientInfo: ClientInfoDto;

  @ApiPropertyOptional({ 
    description: 'Preferred payment method',
    enum: PaymentMethod 
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ 
    description: 'Payment metadata',
    type: PaymentMetadataDto 
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentMetadataDto)
  metadata?: PaymentMetadataDto;

  @ApiPropertyOptional({ 
    description: 'Return URL after payment completion',
    example: 'https://example.com/payment/return' 
  })
  @IsOptional()
  @IsUrl()
  returnUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Callback URL for payment notifications',
    example: 'https://example.com/payment/callback' 
  })
  @IsOptional()
  @IsUrl()
  callbackUrl?: string;

  @ApiPropertyOptional({ 
    description: 'Payment expiration date (ISO 8601)',
    example: '2024-12-31T23:59:59Z' 
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ 
    description: 'Enable automatic retry on failure',
    default: true 
  })
  @IsOptional()
  enableRetry?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Maximum retry attempts',
    minimum: 1,
    maximum: 5,
    default: 3 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  maxRetryAttempts?: number = 3;

  @ApiPropertyOptional({ 
    description: 'Request timeout in milliseconds',
    minimum: 5000,
    maximum: 60000,
    default: 30000 
  })
  @IsOptional()
  @IsNumber()
  @Min(5000)
  @Max(60000)
  timeout?: number = 30000;
}

// ============================================================================
// RESPONSE DTOs
// ============================================================================

export class BasePaymentResponseDto {
  @ApiProperty({ description: 'Operation success status' })
  success: boolean;

  @ApiPropertyOptional({ description: 'Payment ID' })
  paymentId?: string;

  @ApiPropertyOptional({ description: 'Transaction reference' })
  transactionRef?: string;

  @ApiPropertyOptional({ description: 'Response code' })
  respCode?: string;

  @ApiPropertyOptional({ description: 'Response message' })
  respMessage?: string;

  @ApiPropertyOptional({ description: 'Error message if failed' })
  error?: string;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: Date;

  @ApiPropertyOptional({ description: 'Execution time in milliseconds' })
  executionTime?: number;

  @ApiPropertyOptional({ description: 'Response served from cache' })
  cached?: boolean;

  @ApiPropertyOptional({ description: 'Correlation ID for tracking' })
  correlationId?: string;
}

export class PaymentRedirectResponseDto extends BasePaymentResponseDto {
  @ApiPropertyOptional({ description: 'Payment page redirect URL' })
  redirectUrl?: string;

  @ApiPropertyOptional({ description: 'QR code for mobile payments' })
  qrCode?: string;

  @ApiPropertyOptional({ description: 'Deep link for mobile apps' })
  deepLink?: string;
}

export class PaymentVerificationResponseDto extends BasePaymentResponseDto {
  @ApiProperty({ description: 'Payment verification status' })
  verified: boolean;

  @ApiPropertyOptional({ description: 'Payment status' })
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Verified amount' })
  amount?: number;

  @ApiPropertyOptional({ description: 'Verified currency' })
  currency?: PaymentCurrency;

  @ApiPropertyOptional({ description: 'Payment completion date' })
  completedAt?: Date;
}

// ============================================================================
// CALLBACK DTOs
// ============================================================================

export class PaymentCallbackDto {
  @ApiProperty({ description: 'Response code from payment provider' })
  @IsString()
  respCode: string;

  @ApiProperty({ description: 'Response message from payment provider' })
  @IsString()
  respMessage: string;

  @ApiProperty({ description: 'Transaction reference' })
  @IsString()
  transRef: string;

  @ApiProperty({ description: 'Payment status' })
  @IsString()
  respStatus: string;

  @ApiProperty({ description: 'Cart/order information' })
  @IsObject()
  cart: {
    cart_id: string;
    cart_description?: string;
    cart_amount?: number;
    cart_currency?: string;
  };

  @ApiPropertyOptional({ description: 'Webhook signature for verification' })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({ description: 'Callback timestamp' })
  @IsOptional()
  @IsNumber()
  timestamp?: number;

  @ApiPropertyOptional({ description: 'Additional provider data' })
  @IsOptional()
  @IsObject()
  additionalData?: Record<string, any>;
}
