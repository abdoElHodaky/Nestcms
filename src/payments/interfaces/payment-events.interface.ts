export enum PaymentEventType {
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_PROCESSING = 'payment.processing',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  PAYMENT_CANCELLED = 'payment.cancelled',
  WEBHOOK_RECEIVED = 'webhook.received',
  CIRCUIT_OPENED = 'circuit.opened',
  CIRCUIT_CLOSED = 'circuit.closed',
}

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
