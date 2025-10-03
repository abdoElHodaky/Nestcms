import { IsString, IsNumber, IsOptional, IsObject, IsEnum, Min } from 'class-validator';

export enum PaymentMethod {
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  BANK_TRANSFER = 'bank_transfer',
  DIGITAL_WALLET = 'digital_wallet',
}

export enum PaymentCurrency {
  USD = 'USD',
  EUR = 'EUR',
  SAR = 'SAR',
  AED = 'AED',
  KWD = 'KWD',
  BHD = 'BHD',
  QAR = 'QAR',
  OMR = 'OMR',
}

export class EnhancedPaymentDto {
  @IsString()
  contractId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsEnum(PaymentCurrency)
  currency: PaymentCurrency = PaymentCurrency.SAR;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  returnUrl?: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  retryAttempts?: number = 3;

  @IsOptional()
  @IsNumber()
  @Min(1000)
  timeout?: number = 30000;
}

export class PaymentCallbackDto {
  @IsString()
  respCode: string;

  @IsString()
  respMessage: string;

  @IsString()
  transRef: string;

  @IsString()
  respStatus: string;

  @IsObject()
  cart: {
    cart_id: string;
    cart_description?: string;
    cart_amount?: number;
    cart_currency?: string;
  };

  @IsOptional()
  @IsString()
  signature?: string;

  @IsOptional()
  @IsNumber()
  timestamp?: number;
}
