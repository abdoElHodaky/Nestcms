/**
 * 🎯 **PAYMENT QUERY DTOs**
 * 
 * DTOs for querying and filtering payments with comprehensive options.
 * Provides flexible search and filtering capabilities.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { 
  IsOptional, 
  IsString, 
  IsNumber, 
  IsEnum, 
  IsDateString, 
  IsArray, 
  Min, 
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaymentCurrency, PaymentStatus } from './base-payment.dto';

export enum PaymentSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  AMOUNT = 'amount',
  STATUS = 'status',
  TITLE = 'title',
  DUE_DATE = 'date',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaymentQueryDto {
  @ApiPropertyOptional({ 
    description: 'Page number for pagination',
    minimum: 1,
    default: 1 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Number of items per page',
    minimum: 1,
    maximum: 100,
    default: 10 
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Sort by field',
    enum: PaymentSortBy,
    default: PaymentSortBy.CREATED_AT 
  })
  @IsOptional()
  @IsEnum(PaymentSortBy)
  sortBy?: PaymentSortBy = PaymentSortBy.CREATED_AT;

  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: SortOrder,
    default: SortOrder.DESC 
  })
  @IsOptional()
  @IsEnum(SortOrder)
  sortOrder?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({ 
    description: 'Filter by payment status',
    enum: PaymentStatus,
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentStatus, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  status?: PaymentStatus[];

  @ApiPropertyOptional({ 
    description: 'Filter by currency',
    enum: PaymentCurrency,
    isArray: true 
  })
  @IsOptional()
  @IsArray()
  @IsEnum(PaymentCurrency, { each: true })
  @Transform(({ value }) => Array.isArray(value) ? value : [value])
  currency?: PaymentCurrency[];

  @ApiPropertyOptional({ 
    description: 'Minimum amount filter',
    minimum: 0 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Maximum amount filter',
    minimum: 0 
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxAmount?: number;

  @ApiPropertyOptional({ 
    description: 'Filter by creation date from (ISO 8601)',
    example: '2024-01-01T00:00:00Z' 
  })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by creation date to (ISO 8601)',
    example: '2024-12-31T23:59:59Z' 
  })
  @IsOptional()
  @IsDateString()
  createdTo?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by due date from (ISO 8601)',
    example: '2024-01-01' 
  })
  @IsOptional()
  @IsDateString()
  dueDateFrom?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by due date to (ISO 8601)',
    example: '2024-12-31' 
  })
  @IsOptional()
  @IsDateString()
  dueDateTo?: string;

  @ApiPropertyOptional({ 
    description: 'Search in payment title and content' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by contract ID' 
  })
  @IsOptional()
  @IsString()
  contractId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by client ID' 
  })
  @IsOptional()
  @IsString()
  clientId?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by transaction reference' 
  })
  @IsOptional()
  @IsString()
  transactionRef?: string;

  @ApiPropertyOptional({ 
    description: 'Include related data in response',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeRelated?: boolean = false;

  @ApiPropertyOptional({ 
    description: 'Include payment statistics',
    default: false 
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeStats?: boolean = false;
}

export class PaymentStatsDto {
  @ApiProperty({ description: 'Total number of payments' })
  totalPayments: number;

  @ApiProperty({ description: 'Total amount across all payments' })
  totalAmount: number;

  @ApiProperty({ description: 'Average payment amount' })
  averageAmount: number;

  @ApiProperty({ description: 'Payments by status' })
  paymentsByStatus: Record<PaymentStatus, number>;

  @ApiProperty({ description: 'Payments by currency' })
  paymentsByCurrency: Record<PaymentCurrency, number>;

  @ApiProperty({ description: 'Monthly payment trends' })
  monthlyTrends: Array<{
    month: string;
    count: number;
    amount: number;
  }>;

  @ApiProperty({ description: 'Success rate percentage' })
  successRate: number;

  @ApiProperty({ description: 'Statistics generation timestamp' })
  generatedAt: Date;
}

export class PaymentListResponseDto {
  @ApiProperty({ description: 'List of payments' })
  payments: any[]; // Will be typed as Payment[] in actual implementation

  @ApiProperty({ description: 'Pagination information' })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };

  @ApiPropertyOptional({ description: 'Payment statistics' })
  stats?: PaymentStatsDto;

  @ApiProperty({ description: 'Response metadata' })
  metadata: {
    timestamp: Date;
    executionTime: number;
    correlationId?: string;
  };
}

