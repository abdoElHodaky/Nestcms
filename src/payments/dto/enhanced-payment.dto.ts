import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsObject, IsEnum, Min, IsBoolean } from 'class-validator';
import { BasePaymentDto, PaymentMethod, PaymentCurrency } from './base-payment.dto';

/**
 * 🎯 **ENHANCED PAYMENT DTO**
 * 
 * Enhanced DTO for advanced payment processing with additional features
 * like retry configuration, timeout settings, and advanced validation.
 * Extends BasePaymentDto to inherit common payment fields.
 * 
 * @extends BasePaymentDto
 * @author NestCMS Team
 * @version 3.0.0
 */
export class EnhancedPaymentDto extends BasePaymentDto {
  @ApiProperty({ 
    description: 'Contract ID to link payment to',
    example: '507f1f77bcf86cd799439011' 
  })
  @IsString()
  contractId: string;

  @ApiPropertyOptional({ 
    description: 'Enable circuit breaker protection',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  enableCircuitBreaker?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Enable fallback mechanisms',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  enableFallback?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Enable comprehensive error handling',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  enableErrorHandling?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Enable event emission for monitoring',
    default: true 
  })
  @IsOptional()
  @IsBoolean()
  enableEvents?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Enable caching for performance',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  enableCaching?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Cache timeout in seconds',
    minimum: 60,
    maximum: 3600,
    default: 300 
  })
  @IsOptional()
  @IsNumber()
  @Min(60)
  cacheTimeout?: number = 300;

  @ApiPropertyOptional({ 
    description: 'Priority level for payment processing',
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal' 
  })
  @IsOptional()
  @IsEnum(['low', 'normal', 'high', 'urgent'])
  priority?: 'low' | 'normal' | 'high' | 'urgent' = 'normal';

  @ApiPropertyOptional({ 
    description: 'Additional processing options' 
  })
  @IsOptional()
  @IsObject()
  processingOptions?: {
    enableFraudDetection?: boolean;
    enable3DSecure?: boolean;
    enableTokenization?: boolean;
    enableRecurring?: boolean;
    recurringInterval?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  };
}

/**
 * 🎯 **ENHANCED PAYMENT CALLBACK DTO**
 * 
 * Enhanced callback DTO with additional validation and security features.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 */
export class EnhancedPaymentCallbackDto {
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

  @ApiPropertyOptional({ description: 'Payment method used' })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Card information (masked)' })
  @IsOptional()
  @IsObject()
  cardInfo?: {
    maskedNumber?: string;
    brand?: string;
    expiryMonth?: string;
    expiryYear?: string;
    holderName?: string;
  };

  @ApiPropertyOptional({ description: 'Fraud detection results' })
  @IsOptional()
  @IsObject()
  fraudCheck?: {
    score?: number;
    status?: 'passed' | 'failed' | 'review';
    rules?: string[];
  };

  @ApiPropertyOptional({ description: '3D Secure authentication results' })
  @IsOptional()
  @IsObject()
  threeDSecure?: {
    status?: 'authenticated' | 'not_authenticated' | 'attempted';
    eci?: string;
    cavv?: string;
    xid?: string;
  };

  @ApiPropertyOptional({ description: 'Additional provider-specific data' })
  @IsOptional()
  @IsObject()
  providerData?: Record<string, any>;
}

/**
 * 🎯 **PAYMENT VERIFICATION DTO**
 * 
 * DTO for payment verification requests.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 */
export class PaymentVerificationDto {
  @ApiProperty({ 
    description: 'Transaction reference to verify',
    example: 'TXN_123456789' 
  })
  @IsString()
  transactionRef: string;

  @ApiPropertyOptional({ 
    description: 'Payment ID for additional verification',
    example: '507f1f77bcf86cd799439011' 
  })
  @IsOptional()
  @IsString()
  paymentId?: string;

  @ApiPropertyOptional({ 
    description: 'Include detailed transaction information',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Verify payment amount',
    minimum: 0.01 
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  expectedAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Verify payment currency',
    enum: PaymentCurrency 
  })
  @IsOptional()
  @IsEnum(PaymentCurrency)
  expectedCurrency?: PaymentCurrency;
}

