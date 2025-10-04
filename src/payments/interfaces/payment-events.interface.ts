// PaymentEventType enum moved to payment-types.interface.ts to avoid duplication
// Import it from there: import { PaymentEventType } from './payment-types.interface';

export interface PaymentEventData {
  paymentId: string;
  transactionRef?: string;
  amount?: number;
  currency?: string;
  status?: string;
  error?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface WebhookEventData {
  source: string;
  payload: any;
  signature?: string;
  timestamp: Date;
  verified: boolean;
}

export interface CircuitEventData {
  serviceName: string;
  state: string;
  errorRate: number;
  timestamp: Date;
}
