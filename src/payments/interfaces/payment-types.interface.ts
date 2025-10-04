/**
 * 🎯 **CONSOLIDATED PAYMENT TYPES INTERFACE**
 * 
 * Unified interface definitions for all payment-related types, events, and errors.
 * This consolidates payment-events.interface.ts and paytabs-errors.interface.ts
 * to eliminate duplication and provide a single source of truth.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

// ============================================================================
// PAYMENT EVENTS
// ============================================================================

export enum PaymentEventType {
  // Core Payment Events
  PAYMENT_CREATED = 'payment.created',
  PAYMENT_INITIATED = 'payment.initiated',
  PAYMENT_PROCESSING = 'payment.processing',
  PAYMENT_COMPLETED = 'payment.completed',
  PAYMENT_FAILED = 'payment.failed',
  PAYMENT_REFUNDED = 'payment.refunded',
  PAYMENT_PARTIALLY_REFUNDED = 'payment.partially_refunded',
  PAYMENT_CANCELLED = 'payment.cancelled',
  
  // Webhook Events
  WEBHOOK_RECEIVED = 'webhook.received',
  WEBHOOK_PROCESSED = 'webhook.processed',
  WEBHOOK_VALIDATED = 'webhook.validated',
  WEBHOOK_FAILED = 'webhook.failed',
  WEBHOOK_SIGNATURE_INVALID = 'webhook.signature_invalid',
  WEBHOOK_REPLAY_DETECTED = 'webhook.replay_detected',
  
  // Circuit Breaker Events
  CIRCUIT_OPENED = 'circuit.opened',
  CIRCUIT_CLOSED = 'circuit.closed',
  CIRCUIT_HALF_OPEN = 'circuit.half_open',
  CIRCUIT_BREAKER_OPENED = 'circuit_breaker.opened',
  CIRCUIT_BREAKER_CLOSED = 'circuit_breaker.closed',
  CIRCUIT_BREAKER_HALF_OPEN = 'circuit_breaker.half_open',
  
  // Error Events
  ERROR_OCCURRED = 'error.occurred',
  ERROR_RECOVERED = 'error.recovered',
  RETRY_ATTEMPTED = 'retry.attempted',
  PAYMENT_ERROR_OCCURRED = 'payment.error_occurred',
  PAYMENT_RETRY_ATTEMPTED = 'payment.retry_attempted',
  PAYMENT_RETRY_EXHAUSTED = 'payment.retry_exhausted',
  
  // Security Events
  SECURITY_VIOLATION = 'security.violation',
  SECURITY_EVENT = 'security.event',
  SIGNATURE_INVALID = 'signature.invalid',
  REPLAY_ATTACK_DETECTED = 'replay.attack.detected',
  RATE_LIMIT_EXCEEDED = 'rate.limit.exceeded',
  
  // Business Events
  CONTRACT_PAYMENT_DUE = 'contract.payment_due',
  EARNINGS_CALCULATED = 'earnings.calculated',
  NOTIFICATION_SENT = 'notification.sent',
  
  // Audit Events
  PAYMENT_AUDIT_LOG = 'payment.audit_log',
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
  CANCELLED = 'cancelled',
  CREATED = 'created',
}

export interface PaymentEventData {
  paymentId: string;
  transactionRef?: string;
  amount?: number;
  currency?: string;
  status?: PaymentEventStatus;
  error?: PayTabsError;
  timestamp: Date;
  metadata?: Record<string, any>;
  correlationId?: string;
}

// ============================================================================
// COMPREHENSIVE EVENT INTERFACES (Consolidated from external files)
// ============================================================================

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
    signature?: string;
    receivedAt: Date;
    validated: boolean;
    ipAddress: string;
    userAgent?: string;
  };
}

export interface CircuitBreakerEvent extends BasePaymentEvent {
  type: PaymentEventType.CIRCUIT_BREAKER_OPENED | PaymentEventType.CIRCUIT_BREAKER_CLOSED | PaymentEventType.CIRCUIT_BREAKER_HALF_OPEN;
  data: {
    serviceName: string;
    state: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
    errorRate: number;
    consecutiveFailures?: number;
    lastFailure?: Date;
    threshold?: number;
    timeout?: number;
    requestCount?: number;
    totalRequests?: number;
    failureCount?: number;
    failedRequests?: number;
    lastFailureTime?: Date;
    nextRetryTime?: Date;
    configuration?: any;
    [key: string]: any; // Allow additional properties
  };
}

export interface PaymentAuditEvent extends BasePaymentEvent {
  type: PaymentEventType.PAYMENT_AUDIT_LOG;
  data: {
    paymentId: string;
    operation: string;
    operationStatus: 'success' | 'failure' | 'retry' | 'timeout';
    duration: number;
    error?: any;
    changes?: {
      before: any;
      after: any;
    };
    performedBy: string;
    performedAt: Date;
  };
}

export interface SecurityEvent extends BasePaymentEvent {
  type: PaymentEventType.SECURITY_EVENT | PaymentEventType.SECURITY_VIOLATION;
  data: {
    securityEventType: 'signature_invalid' | 'replay_attack' | 'rate_limit_exceeded' | 'ip_blocked' | 'suspicious_activity';
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    ipAddress: string;
    userAgent?: string;
    blocked: boolean;
    reason: string;
    securityScore: number;
    detectedAt: Date;
  };
}

export interface WebhookEventData {
  source: string;
  payload: any;
  signature?: string;
  timestamp: Date;
  verified: boolean;
  ipAddress?: string;
  userAgent?: string;
}

export interface CircuitEventData {
  serviceName: string;
  state: 'OPEN' | 'CLOSED' | 'HALF_OPEN';
  errorRate: number;
  timestamp: Date;
  consecutiveFailures?: number;
  lastFailure?: Date;
}



export interface PaymentErrorEvent {
  type: PaymentEventType;
  priority: PaymentEventPriority;
  error: PayTabsError;
  context: PayTabsErrorContext;
  timestamp: Date;
  correlationId: string;
}

export interface PerformanceMetricEvent extends BasePaymentEvent {
  type: PaymentEventType.PERFORMANCE_METRIC;
  data: {
    serviceName: string;
    operationName: string;
    duration: number;
    success: boolean;
    errorRate: number;
    throughput: number;
    timestamp: Date;
    metadata?: Record<string, any>;
    metricName?: string;
    metricValue?: any;
    metricUnit?: string;
    tags?: Record<string, string>;
    context?: Record<string, any>;
  };
}

// ============================================================================
// PAYMENT ERRORS
// ============================================================================

export enum PayTabsErrorType {
  // Network Errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // Authentication Errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Payment Errors
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_CARD = 'INVALID_CARD',
  CARD_EXPIRED = 'CARD_EXPIRED',
  CARD_DECLINED = 'CARD_DECLINED',
  FRAUD_DETECTED = 'FRAUD_DETECTED',
  
  // Business Logic Errors
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  INVALID_CURRENCY = 'INVALID_CURRENCY',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  TRANSACTION_NOT_FOUND = 'TRANSACTION_NOT_FOUND',
  
  // System Errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  MAINTENANCE_MODE = 'MAINTENANCE_MODE',
  
  // Configuration Errors
  INVALID_CONFIG = 'INVALID_CONFIG',
  MISSING_CREDENTIALS = 'MISSING_CREDENTIALS',
  INVALID_REGION = 'INVALID_REGION',
  
  // Webhook Errors
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  WEBHOOK_TIMEOUT = 'WEBHOOK_TIMEOUT',
  REPLAY_ATTACK = 'REPLAY_ATTACK',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
}

export enum PayTabsErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum PayTabsErrorRecoveryStrategy {
  RETRY_WITH_BACKOFF = 'retry_with_backoff',
  RETRY_AFTER_DELAY = 'retry_after_delay',
  REFRESH_CREDENTIALS = 'refresh_credentials',
  FIX_REQUEST_DATA = 'fix_request_data',
  MANUAL_INTERVENTION = 'manual_intervention',
  FIX_CONFIGURATION = 'fix_configuration',
  CIRCUIT_BREAK = 'circuit_break',
  FALLBACK = 'fallback',
  FAIL_FAST = 'fail_fast',
}

export interface PayTabsError {
  type: PayTabsErrorType;
  severity: PayTabsErrorSeverity;
  message: string;
  code: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
  retryAfter?: number; // seconds
  context?: PayTabsErrorContext;
  correlationId?: string;
}

export interface PayTabsErrorContext {
  paymentId?: string;
  transactionRef?: string;
  operation?: string;
  attempt?: number;
  clientId?: string;
  amount?: number;
  currency?: string;
  provider?: string;
  endpoint?: string;
  requestId?: string;
  userId?: string;
  correlationId?: string;
  retryCount?: number;
  contractId?: string;
  executionTime?: number;
  webhookId?: string;
  startTime?: Date | number;
  [key: string]: any; // Allow additional properties
}

export interface PayTabsErrorMetrics {
  errorType: PayTabsErrorType;
  count: number;
  lastOccurrence: Date;
  averageResolutionTime: number;
  successfulRetries: number;
  failedRetries: number;
  totalAttempts: number;
  totalCount?: number;
  retrySuccessRate?: number;
  severityDistribution?: {
    LOW: number;
    MEDIUM: number;
    HIGH: number;
    CRITICAL: number;
  };
}

// ============================================================================
// RESILIENCE PATTERNS
// ============================================================================

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: PayTabsErrorType[];
}

export interface CircuitBreakerConfig {
  errorThreshold: number; // percentage
  timeout: number; // milliseconds
  resetTimeout: number; // milliseconds
  monitoringPeriod: number; // milliseconds
  minimumRequests: number;
  slowCallThreshold?: number; // milliseconds
  slowCallRateThreshold?: number; // percentage
}

export interface FallbackConfig {
  enabled: boolean;
  strategy: 'cache' | 'queue' | 'alternative_provider' | 'graceful_degradation';
  cacheTimeout?: number;
  queueTimeout?: number;
  alternativeProvider?: string;
}

export interface ResilienceConfig {
  retry: RetryConfig;
  circuitBreaker: CircuitBreakerConfig;
  fallback: FallbackConfig;
  timeout: number;
  bulkhead: {
    maxConcurrentRequests: number;
    queueSize: number;
  };
}

// ============================================================================
// WEBHOOK SECURITY
// ============================================================================

export interface WebhookSecurityConfig {
  signatureHeader: string;
  algorithm: 'sha256' | 'sha512';
  secretKey: string;
  timestampHeader?: string;
  timestampTolerance?: number; // seconds
  ipWhitelist?: string[];
  requireHttps: boolean;
  maxPayloadSize: number; // bytes
  enableReplayProtection: boolean;
  enableRateLimiting: boolean;
  rateLimitWindow: number; // milliseconds
  rateLimitMax: number;
}

export interface WebhookValidationRequest {
  payload: string;
  signature: string;
  timestamp: string;
  ipAddress: string;
  headers: Record<string, string>;
  userAgent?: string;
  contentType?: string;
}

export interface WebhookValidationResult {
  isValid: boolean;
  signatureValid: boolean;
  timestampValid: boolean;
  ipWhitelisted: boolean;
  replayDetected: boolean;
  rateLimitExceeded: boolean;
  reason?: string;
  securityScore: number;
  validationDetails: {
    signatureAlgorithm: string;
    timestampDifference: number;
    payloadSize: number;
    ipAddress: string;
    userAgent?: string;
    validationTime: number;
  };
}

export interface WebhookSecurityMetrics {
  totalRequests: number;
  validRequests: number;
  invalidRequests: number;
  signatureFailures: number;
  timestampFailures: number;
  ipBlockedRequests: number;
  replayAttacks: number;
  rateLimitViolations: number;
  lastValidRequest: Date;
  lastSecurityViolation: Date;
  averageValidationTime: number;
  securityScore: number;
}

// ============================================================================
// PAYMENT PROCESSING
// ============================================================================

export interface PaymentFailureContext {
  paymentId: string;
  transactionRef?: string;
  amount: number;
  currency: string;
  clientId: string;
  errorHistory: PayTabsError[];
  retryCount: number;
  lastAttempt: Date;
}

export interface PaymentRecoveryOptions {
  enableAutoRetry: boolean;
  enableFallback: boolean;
  enableCircuitBreaker: boolean;
  enableBulkhead: boolean;
  enableRateLimiting: boolean;
  notifyOnFailure: boolean;
  escalateAfterAttempts: number;
}

export interface PaymentHealthMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  lastFailure?: Date;
  consecutiveFailures: number;
  uptime: number; // percentage
}

export interface PaymentRecoveryResult {
  recovered: boolean;
  strategy: PayTabsErrorRecoveryStrategy;
  attempts: number;
  finalStatus: 'success' | 'failure' | 'pending';
  error?: PayTabsError;
  recoveryTime: number; // milliseconds
}

export interface PaymentAuditLog {
  id: string;
  paymentId: string;
  transactionRef?: string;
  operation: string;
  status: 'success' | 'failure' | 'retry' | 'timeout';
  error?: PayTabsError;
  duration: number; // milliseconds
  timestamp: Date;
  metadata?: any;
}

export interface AlertConfig {
  errorRateThreshold: number; // percentage
  responseTimeThreshold: number; // milliseconds
  consecutiveFailuresThreshold: number;
  webhookFailureThreshold: number;
  channels: ('email' | 'slack' | 'webhook')[];
  recipients: string[];
}

// ============================================================================
// PAYTABS PROVIDER SPECIFIC
// ============================================================================

export interface PayTabsConfig {
  profileId: string;
  serverKey: string;
  region: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableLogging: boolean;
  enableMetrics: boolean;
}

export interface PayTabsRequest {
  amount: number;
  currency: string;
  description: string;
  clientInfo: {
    name: string;
    email: string;
    phone: string;
    address: any;
  };
  redirectUrl?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PayTabsResponse {
  success: boolean;
  redirectUrl?: string;
  transactionRef?: string;
  respCode?: string;
  respMessage?: string;
  error?: string;
  cached?: boolean;
  executionTime: number;
}

export interface PayTabsVerificationRequest {
  transactionRef: string;
  paymentId?: string;
}

export interface PayTabsVerificationResult {
  valid: boolean;
  transactionRef: string;
  responseCode: string;
  status: string;
  amount?: number;
  currency?: string;
  error?: string;
}

// ============================================================================
// LEGACY COMPATIBILITY (Deprecated - will be removed in v4.0)
// ============================================================================

/**
 * @deprecated Use PaymentEventData instead
 */
export interface LegacyPaymentEventData extends PaymentEventData {}

/**
 * @deprecated Use WebhookEventData instead
 */
export interface LegacyWebhookEventData extends WebhookEventData {}

/**
 * @deprecated Use CircuitEventData instead
 */
export interface LegacyCircuitEventData extends CircuitEventData {}
