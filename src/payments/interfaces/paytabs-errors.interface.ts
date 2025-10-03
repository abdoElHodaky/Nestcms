/**
 * PayTabs Error Handling and Resilience Patterns
 * Comprehensive error types and resilience interfaces
 */

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

export interface PayTabsError {
  type: PayTabsErrorType;
  severity: PayTabsErrorSeverity;
  message: string;
  code: string;
  details?: any;
  timestamp: Date;
  retryable: boolean;
  retryAfter?: number; // seconds
  context?: {
    paymentId?: string;
    transactionRef?: string;
    operation?: string;
    attempt?: number;
  };
}

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

export interface ErrorRecoveryStrategy {
  type: PayTabsErrorType;
  action: 'retry' | 'fallback' | 'fail_fast' | 'circuit_break';
  config?: any;
}

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

export interface WebhookSecurityConfig {
  signatureHeader: string;
  algorithm: 'sha256' | 'sha512';
  secretKey: string;
  timestampHeader?: string;
  timestampTolerance?: number; // seconds
  ipWhitelist?: string[];
  requireHttps: boolean;
  maxPayloadSize: number; // bytes
}

export interface WebhookValidationResult {
  valid: boolean;
  error?: string;
  errorType?: PayTabsErrorType;
  timestamp?: Date;
  ipAddress?: string;
  userAgent?: string;
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

export interface AlertConfig {
  errorRateThreshold: number; // percentage
  responseTimeThreshold: number; // milliseconds
  consecutiveFailuresThreshold: number;
  webhookFailureThreshold: number;
  channels: ('email' | 'slack' | 'webhook')[];
  recipients: string[];
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

export interface PaymentRecoveryResult {
  recovered: boolean;
  strategy: string;
  attempts: number;
  finalStatus: 'success' | 'failure' | 'pending';
  error?: PayTabsError;
  recoveryTime: number; // milliseconds
}

