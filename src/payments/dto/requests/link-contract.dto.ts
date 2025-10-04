/**
 * 🎯 **PAYMENT-CONTRACT LINKING DTO**
 * 
 * DTO for linking payments to contracts with proper validation.
 * Enhanced with comprehensive documentation and validation.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsDateString, IsEnum } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export enum LinkingStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

export class PaymentLinkToContractDto {
  @ApiProperty({ 
    description: 'Payment ID to link',
    example: '507f1f77bcf86cd799439011' 
  })
  @IsNotEmpty()
  @IsObjectId()
  paymentId: string;

  @ApiProperty({ 
    description: 'Contract ID to link to',
    example: '507f1f77bcf86cd799439012' 
  })
  @IsNotEmpty()
  @IsObjectId()
  contractId: string;

  @ApiPropertyOptional({ 
    description: 'Linking status',
    enum: LinkingStatus,
    default: LinkingStatus.ACTIVE 
  })
  @IsOptional()
  @IsEnum(LinkingStatus)
  status?: LinkingStatus = LinkingStatus.ACTIVE;

  @ApiPropertyOptional({ 
    description: 'Link expiration date (ISO 8601)',
    example: '2024-12-31T23:59:59Z' 
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({ 
    description: 'Additional notes for the link' 
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PaymentUnlinkFromContractDto {
  @ApiProperty({ 
    description: 'Payment ID to unlink',
    example: '507f1f77bcf86cd799439011' 
  })
  @IsNotEmpty()
  @IsObjectId()
  paymentId: string;

  @ApiProperty({ 
    description: 'Contract ID to unlink from',
    example: '507f1f77bcf86cd799439012' 
  })
  @IsNotEmpty()
  @IsObjectId()
  contractId: string;

  @ApiPropertyOptional({ 
    description: 'Reason for unlinking' 
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
