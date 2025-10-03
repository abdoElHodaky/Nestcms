/**
 * 🎯 **EVENT-DRIVEN PAYMENT ARCHITECTURE**
 * 
 * Comprehensive event system for payment lifecycle management with
 * domain events, event sourcing, and asynchronous processing.
 * 
 * @author NestCMS Team
 * @version 2.0.0
 * @since 2024-01-15
 */

export enum PaymentEventType {
  // Payment Lifecycle Events
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_PROCESSING = 'payment.processing',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_CANCELLED = 'payment.cancelled',
  PAYMENT_REFUNDED = 'payment.refunded',
  PAYMENT_PARTIALLY_REFUNDED = 'payment.partially_refunded',
  
  // Webhook Events
  WEBHOOK_RECEIVED = 'webhook.received',
  WEBHOOK_PROCESSED = 'webhook.processed',
  WEBHOOK_FAILED = 'webhook.failed',
  WEBHOOK_SIGNATURE_INVALID = 'webhook.signature_invalid',
  WEBHOOK_REPLAY_DETECTED = 'webhook.replay_detected',
  
  // Circuit Breaker Events
  CIRCUIT_BREAKER_OPENED = 'circuit_breaker.opened',
  CIRCUIT_BREAKER_CLOSED = 'circuit_breaker.closed',
  CIRCUIT_BREAKER_HALF_OPEN = 'circuit_breaker.half_open',
  
  // Error Events
  PAYMENT_ERROR_OCCURRED = 'payment.error_occurred',
  PAYMENT_RETRY_ATTEMPTED = 'payment.retry_attempted',
  PAYMENT_RETRY_EXHAUSTED = 'payment.retry_exhausted',
  
  // Business Events
  CONTRACT_PAYMENT_DUE = 'contract.payment_due',
  EARNINGS_CALCULATED = 'earnings.calculated',
  NOTIFICATION_SENT = 'notification.sent',
  
  // Audit Events
  PAYMENT_AUDIT_LOG = 'payment.audit_log',
  SECURITY_EVENT = 'security.event',
  PERFORMANCE_METRIC = 'performance.metric',
}

export enum PaymentEventPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum PaymentEventStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  RETRYING = 'retrying',
}

export interface BasePaymentEvent {
  id: string;
  type: PaymentEventType;
  timestamp: Date;
  version: string;
  priority: PaymentEventPriority;
  status: PaymentEventStatus;
  correlationId: string;
  causationId?: string;
  aggregateId: string;
  aggregateType: string;
  metadata: {
    source: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    traceId?: string;
    spanId?: string;
  };
}

export interface PaymentInitiatedEvent extends BasePaymentEvent {
  type: PaymentEventType.PAYMENT_INITIATED;
  data: {
    paymentId: string;
    contractId: string;
    amount: number;
    currency: string;
    description: string;
    clientInfo: {
      name: string;
      email: string;
      phone: string;
      address: any;
    };
    paymentMethod: string;
    redirectUrl?: string;
    callbackUrl?: string;
  };
}

export interface PaymentProcessingEvent extends BasePaymentEvent {
  type: PaymentEventType.PAYMENT_PROCESSING;
  data: {
    paymentId: string;
    transactionRef: string;
    gatewayProvider: string;
    processingStartTime: Date;
    estimatedCompletionTime?: Date;
  };
}

export interface PaymentCompletedEvent extends BasePaymentEvent {
  type: PaymentEventType.PAYMENT_COMPLETED;
  data: {
    paymentId: string;
    transactionRef: string;
    amount: number;
    currency: string;
    gatewayResponse: any;
    completedAt: Date;
    processingDuration: number;
  };
}

export interface PaymentFailedEvent extends BasePaymentEvent {
  type: PaymentEventType.PAYMENT_FAILED;
  data: {
    paymentId: string;
    transactionRef?: string;
    errorCode: string;
    errorMessage: string;
    errorDetails: any;
    failedAt: Date;
    retryable: boolean;
    retryCount: number;
  };
}

export interface WebhookReceivedEvent extends BasePaymentEvent {
  type: PaymentEventType.WEBHOOK_RECEIVED;
  data: {
    webhookId: string;
    paymentId?: string;
    transactionRef?: string;
    provider: string;
    payload: any;
    signature: string;
    timestamp: string;
    ipAddress: string;
    headers: Record<string, string>;
  };
}

export interface CircuitBreakerEvent extends BasePaymentEvent {
  type: PaymentEventType.CIRCUIT_BREAKER_OPENED | PaymentEventType.CIRCUIT_BREAKER_CLOSED | PaymentEventType.CIRCUIT_BREAKER_HALF_OPEN;
  data: {
    serviceName: string;
    state: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
    errorRate: number;
    requestCount: number;
    failureCount: number;
    lastFailureTime?: Date;
    nextRetryTime?: Date;
    configuration: {
      errorThreshold: number;
      timeout: number;
      resetTimeout: number;
      minimumRequests: number;
    };
  };
}

export interface PaymentErrorEvent extends BasePaymentEvent {
  type: PaymentEventType.PAYMENT_ERROR_OCCURRED;
  data: {
    paymentId: string;
    errorType: string;
    errorCode: string;
    errorMessage: string;
    errorStack?: string;
    context: any;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recoverable: boolean;
    retryStrategy?: string;
  };
}

export interface ContractPaymentDueEvent extends BasePaymentEvent {
  type: PaymentEventType.CONTRACT_PAYMENT_DUE;
  data: {
    contractId: string;
    projectId: string;
    dueAmount: number;
    currency: string;
    dueDate: Date;
    clientId: string;
    remindersSent: number;
    overdueDays?: number;
  };
}

export interface EarningsCalculatedEvent extends BasePaymentEvent {
  type: PaymentEventType.EARNINGS_CALCULATED;
  data: {
    userId: string;
    projectId?: string;
    contractId?: string;
    period: {
      startDate: Date;
      endDate: Date;
    };
    earnings: {
      gross: number;
      net: number;
      taxes: number;
      deductions: number;
      currency: string;
    };
    calculationMethod: string;
    calculatedAt: Date;
  };
}

export interface PaymentAuditEvent extends BasePaymentEvent {
  type: PaymentEventType.PAYMENT_AUDIT_LOG;
  data: {
    action: string;
    resource: string;
    resourceId: string;
    oldValues?: any;
    newValues?: any;
    changes: string[];
    performedBy: string;
    performedAt: Date;
    reason?: string;
    ipAddress: string;
    userAgent: string;
  };
}

export interface SecurityEvent extends BasePaymentEvent {
  type: PaymentEventType.SECURITY_EVENT;
  data: {
    eventType: 'AUTHENTICATION_FAILURE' | 'AUTHORIZATION_FAILURE' | 'SUSPICIOUS_ACTIVITY' | 'WEBHOOK_SECURITY_VIOLATION';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    sourceIp: string;
    userAgent?: string;
    userId?: string;
    additionalData: any;
    detectedAt: Date;
    mitigationActions: string[];
  };
}

export interface PerformanceMetricEvent extends BasePaymentEvent {
  type: PaymentEventType.PERFORMANCE_METRIC;
  data: {
    metricName: string;
    metricValue: number;
    metricUnit: string;
    tags: Record<string, string>;
    timestamp: Date;
    context: {
      service: string;
      operation: string;
      duration?: number;
      statusCode?: number;
      errorRate?: number;
    };
  };
}

// Union type for all payment events
export type PaymentEvent = 
  | PaymentInitiatedEvent
  | PaymentProcessingEvent
  | PaymentCompletedEvent
  | PaymentFailedEvent
  | WebhookReceivedEvent
  | CircuitBreakerEvent
  | PaymentErrorEvent
  | ContractPaymentDueEvent
  | EarningsCalculatedEvent
  | PaymentAuditEvent
  | SecurityEvent
  | PerformanceMetricEvent;

// Event Handler Interface
export interface PaymentEventHandler<T extends PaymentEvent = PaymentEvent> {
  handle(event: T): Promise<void>;
  canHandle(event: PaymentEvent): boolean;
  priority: number;
  retryable: boolean;
  maxRetries: number;
}

// Event Store Interface
export interface PaymentEventStore {
  append(events: PaymentEvent[]): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<PaymentEvent[]>;
  getEventsByType(eventType: PaymentEventType, limit?: number): Promise<PaymentEvent[]>;
  getEventsByCorrelationId(correlationId: string): Promise<PaymentEvent[]>;
  createSnapshot(aggregateId: string, version: number, data: any): Promise<void>;
  getSnapshot(aggregateId: string): Promise<{ version: number; data: any } | null>;
}

// Event Bus Interface
export interface PaymentEventBus {
  publish(event: PaymentEvent): Promise<void>;
  publishBatch(events: PaymentEvent[]): Promise<void>;
  subscribe<T extends PaymentEvent>(eventType: PaymentEventType, handler: PaymentEventHandler<T>): void;
  unsubscribe(eventType: PaymentEventType, handler: PaymentEventHandler): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// Event Projection Interface
export interface PaymentEventProjection {
  name: string;
  version: number;
  project(event: PaymentEvent): Promise<void>;
  rebuild(): Promise<void>;
  getLastProcessedEventId(): Promise<string | null>;
  setLastProcessedEventId(eventId: string): Promise<void>;
}

// Saga Interface for Complex Business Processes
export interface PaymentSaga {
  sagaId: string;
  sagaType: string;
  isCompleted: boolean;
  handle(event: PaymentEvent): Promise<PaymentEvent[]>;
  compensate(): Promise<PaymentEvent[]>;
}

// Event Sourcing Aggregate Interface
export interface PaymentAggregate {
  id: string;
  version: number;
  uncommittedEvents: PaymentEvent[];
  apply(event: PaymentEvent): void;
  getUncommittedEvents(): PaymentEvent[];
  markEventsAsCommitted(): void;
  loadFromHistory(events: PaymentEvent[]): void;
}
