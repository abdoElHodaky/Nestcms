/**
 * 🛡️ **PAYTABS ERROR HANDLER SERVICE**
 * 
 * Comprehensive error handling and resilience patterns for PayTabs integration
 * with intelligent retry mechanisms, circuit breaker integration, and detailed
 * error classification and recovery strategies.
 * 
 * @author NestCMS Team
 * @version 2.0.0
 * @since 2024-01-15
 */

import { Injectable, Logger, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { 
  PayTabsError,
  PayTabsErrorType,
  PayTabsErrorSeverity,
  PayTabsRetryConfig,
  PayTabsErrorContext,
  PayTabsErrorRecoveryStrategy,
  PayTabsErrorMetrics,
} from '../interfaces/payment-types.interface';
import { 
  PaymentEventType,
  PaymentErrorEvent,
  PaymentEventPriority,
  PaymentEventStatus,
} from '../interfaces/payment-types.interface';

export interface PayTabsErrorHandlerConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  circuitBreakerEnabled: boolean;
  metricsEnabled: boolean;
  alertingEnabled: boolean;
  fallbackEnabled: boolean;
}

export interface ErrorHandlingResult {
  shouldRetry: boolean;
  retryAfter: number;
  retryable: boolean;
  errorCode: string;
  userMessage: string;
  technicalMessage: string;
  severity: PayTabsErrorSeverity;
  recoveryStrategy: PayTabsErrorRecoveryStrategy;
  httpStatus: HttpStatus;
  details: any;
  correlationId: string;
}

@Injectable()
export class PayTabsErrorHandlerService {
  private readonly logger = new Logger(PayTabsErrorHandlerService.name);
  private readonly config: PayTabsErrorHandlerConfig;
  private readonly errorMetrics = new Map<PayTabsErrorType, PayTabsErrorMetrics>();
  private readonly errorHistory: PayTabsError[] = [];

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.config = {
      maxRetries: this.configService.get<number>('PAYTABS_MAX_RETRIES', 3),
      baseDelay: this.configService.get<number>('PAYTABS_RETRY_DELAY', 1000),
      maxDelay: this.configService.get<number>('PAYTABS_MAX_RETRY_DELAY', 30000),
      backoffMultiplier: this.configService.get<number>('PAYTABS_BACKOFF_MULTIPLIER', 2),
      jitterEnabled: this.configService.get<boolean>('PAYTABS_RETRY_JITTER', true),
      circuitBreakerEnabled: this.configService.get<boolean>('PAYTABS_CIRCUIT_BREAKER_ENABLED', true),
      metricsEnabled: this.configService.get<boolean>('PAYTABS_METRICS_ENABLED', true),
      alertingEnabled: this.configService.get<boolean>('PAYTABS_ALERTING_ENABLED', true),
      fallbackEnabled: this.configService.get<boolean>('PAYTABS_FALLBACK_ENABLED', true),
    };

    this.initializeErrorMetrics();
  }

  /**
   * Handle PayTabs errors with comprehensive error analysis and recovery
   */
  async handleError(error: any, context: PayTabsErrorContext): Promise<ErrorHandlingResult> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      // Classify the error
      const payTabsError = this.classifyError(error, context);
      
      // Record error metrics
      this.recordErrorMetrics(payTabsError);
      
      // Add to error history
      this.addToErrorHistory(payTabsError);
      
      // Determine recovery strategy
      const recoveryStrategy = this.determineRecoveryStrategy(payTabsError, context);
      
      // Calculate retry parameters
      const retryConfig = this.calculateRetryParameters(payTabsError, context);
      
      // Generate user-friendly messages
      const messages = this.generateErrorMessages(payTabsError);
      
      // Emit error event
      if (this.config.metricsEnabled) {
        await this.emitErrorEvent(payTabsError, context, correlationId);
      }
      
      // Trigger alerts if necessary
      if (this.config.alertingEnabled && this.shouldTriggerAlert(payTabsError)) {
        await this.triggerAlert(payTabsError, context);
      }

      const result: ErrorHandlingResult = {
        shouldRetry: retryConfig.shouldRetry,
        retryAfter: retryConfig.retryAfter,
        retryable: this.isRetryableError(payTabsError.type),
        errorCode: payTabsError.code,
        userMessage: messages.userMessage,
        technicalMessage: messages.technicalMessage,
        severity: payTabsError.severity,
        recoveryStrategy,
        httpStatus: this.mapToHttpStatus(payTabsError.type),
        details: {
          errorType: payTabsError.type,
          originalError: error.message,
          context,
          retryCount: context.retryCount || 0,
          processingTime: Date.now() - startTime,
        },
        correlationId,
      };

      this.logger.log(`Error handled: ${payTabsError.type} - ${payTabsError.code} (${correlationId})`);
      
      return result;

    } catch (handlingError) {
      this.logger.error(`Error handling failed: ${handlingError.message}`, handlingError.stack);
      
      // Return fallback error result
      return this.createFallbackErrorResult(error, context, correlationId);
    }
  }

  /**
   * Classify error based on PayTabs response and context
   */
  private classifyError(error: any, context: PayTabsErrorContext): PayTabsError {
    const timestamp = new Date();
    
    // Network/Connection errors
    if (this.isNetworkError(error)) {
      return {
        type: PayTabsErrorType.NETWORK_ERROR,
        code: 'NETWORK_TIMEOUT',
        message: 'Network connection timeout or failure',
        severity: PayTabsErrorSeverity.HIGH,
        timestamp,
        context,
        retryable: true,
        details: {
          originalError: error.message,
          errorCode: error.code,
          timeout: error.timeout,
        },
      };
    }

    // PayTabs API errors
    if (error.response && error.response.data) {
      const responseData = error.response.data;
      
      // Authentication errors
      if (this.isAuthenticationError(responseData)) {
        return {
          type: PayTabsErrorType.AUTHENTICATION_ERROR,
          code: 'AUTH_FAILED',
          message: 'PayTabs authentication failed',
          severity: PayTabsErrorSeverity.CRITICAL,
          timestamp,
          context,
          retryable: false,
          details: responseData,
        };
      }

      // Validation errors
      if (this.isValidationError(responseData)) {
        return {
          type: PayTabsErrorType.VALIDATION_ERROR,
          code: 'VALIDATION_FAILED',
          message: 'Request validation failed',
          severity: PayTabsErrorSeverity.MEDIUM,
          timestamp,
          context,
          retryable: false,
          details: responseData,
        };
      }

      // Payment processing errors
      if (this.isPaymentProcessingError(responseData)) {
        return {
          type: PayTabsErrorType.PAYMENT_PROCESSING_ERROR,
          code: responseData.respCode || 'PROCESSING_FAILED',
          message: responseData.respMessage || 'Payment processing failed',
          severity: PayTabsErrorSeverity.HIGH,
          timestamp,
          context,
          retryable: this.isRetryablePaymentError(responseData.respCode),
          details: responseData,
        };
      }

      // Rate limiting errors
      if (this.isRateLimitError(error.response.status)) {
        return {
          type: PayTabsErrorType.RATE_LIMIT_ERROR,
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'PayTabs API rate limit exceeded',
          severity: PayTabsErrorSeverity.MEDIUM,
          timestamp,
          context,
          retryable: true,
          details: {
            statusCode: error.response.status,
            retryAfter: error.response.headers['retry-after'],
          },
        };
      }

      // Server errors
      if (error.response.status >= 500) {
        return {
          type: PayTabsErrorType.SERVER_ERROR,
          code: 'SERVER_ERROR',
          message: 'PayTabs server error',
          severity: PayTabsErrorSeverity.HIGH,
          timestamp,
          context,
          retryable: true,
          details: {
            statusCode: error.response.status,
            response: responseData,
          },
        };
      }
    }

    // Configuration errors
    if (this.isConfigurationError(error)) {
      return {
        type: PayTabsErrorType.CONFIGURATION_ERROR,
        code: 'CONFIG_ERROR',
        message: 'PayTabs configuration error',
        severity: PayTabsErrorSeverity.CRITICAL,
        timestamp,
        context,
        retryable: false,
        details: {
          configError: error.message,
        },
      };
    }

    // Unknown errors
    return {
      type: PayTabsErrorType.UNKNOWN_ERROR,
      code: 'UNKNOWN_ERROR',
      message: error.message || 'Unknown error occurred',
      severity: PayTabsErrorSeverity.MEDIUM,
      timestamp,
      context,
      retryable: false,
      details: {
        originalError: error,
        stack: error.stack,
      },
    };
  }

  /**
   * Determine recovery strategy based on error type and context
   */
  private determineRecoveryStrategy(
    error: PayTabsError, 
    context: PayTabsErrorContext
  ): PayTabsErrorRecoveryStrategy {
    switch (error.type) {
      case PayTabsErrorType.NETWORK_ERROR:
      case PayTabsErrorType.SERVER_ERROR:
        return PayTabsErrorRecoveryStrategy.RETRY_WITH_BACKOFF;

      case PayTabsErrorType.RATE_LIMIT_ERROR:
        return PayTabsErrorRecoveryStrategy.RETRY_AFTER_DELAY;

      case PayTabsErrorType.AUTHENTICATION_ERROR:
        return PayTabsErrorRecoveryStrategy.REFRESH_CREDENTIALS;

      case PayTabsErrorType.VALIDATION_ERROR:
        return PayTabsErrorRecoveryStrategy.FIX_REQUEST_DATA;

      case PayTabsErrorType.PAYMENT_PROCESSING_ERROR:
        if (error.retryable) {
          return PayTabsErrorRecoveryStrategy.RETRY_WITH_BACKOFF;
        }
        return PayTabsErrorRecoveryStrategy.MANUAL_INTERVENTION;

      case PayTabsErrorType.CONFIGURATION_ERROR:
        return PayTabsErrorRecoveryStrategy.FIX_CONFIGURATION;

      default:
        return PayTabsErrorRecoveryStrategy.MANUAL_INTERVENTION;
    }
  }

  /**
   * Calculate retry parameters with exponential backoff and jitter
   */
  private calculateRetryParameters(
    error: PayTabsError, 
    context: PayTabsErrorContext
  ): { shouldRetry: boolean; retryAfter: number } {
    const retryCount = context.retryCount || 0;

    // Don't retry if max retries exceeded
    if (retryCount >= this.config.maxRetries) {
      return { shouldRetry: false, retryAfter: 0 };
    }

    // Don't retry non-retryable errors
    if (!error.retryable) {
      return { shouldRetry: false, retryAfter: 0 };
    }

    // Calculate exponential backoff delay
    let delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, retryCount);
    
    // Apply maximum delay limit
    delay = Math.min(delay, this.config.maxDelay);
    
    // Add jitter to prevent thundering herd
    if (this.config.jitterEnabled) {
      const jitter = Math.random() * 0.1 * delay; // 10% jitter
      delay += jitter;
    }

    // Special handling for rate limit errors
    if (error.type === PayTabsErrorType.RATE_LIMIT_ERROR && error.details?.retryAfter) {
      delay = Math.max(delay, parseInt(error.details.retryAfter) * 1000);
    }

    return { shouldRetry: true, retryAfter: Math.round(delay) };
  }

  /**
   * Generate user-friendly and technical error messages
   */
  private generateErrorMessages(error: PayTabsError): {
    userMessage: string;
    technicalMessage: string;
  } {
    const userMessages = {
      [PayTabsErrorType.NETWORK_ERROR]: 'Payment service is temporarily unavailable. Please try again in a few moments.',
      [PayTabsErrorType.AUTHENTICATION_ERROR]: 'Payment service authentication failed. Please contact support.',
      [PayTabsErrorType.VALIDATION_ERROR]: 'Payment information is invalid. Please check your details and try again.',
      [PayTabsErrorType.PAYMENT_PROCESSING_ERROR]: 'Payment could not be processed. Please try again or use a different payment method.',
      [PayTabsErrorType.RATE_LIMIT_ERROR]: 'Too many payment requests. Please wait a moment and try again.',
      [PayTabsErrorType.SERVER_ERROR]: 'Payment service is experiencing issues. Please try again later.',
      [PayTabsErrorType.CONFIGURATION_ERROR]: 'Payment service configuration error. Please contact support.',
      [PayTabsErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please try again or contact support.',
    };

    const userMessage = userMessages[error.type] || userMessages[PayTabsErrorType.UNKNOWN_ERROR];
    const technicalMessage = `${error.type}: ${error.code} - ${error.message}`;

    return { userMessage, technicalMessage };
  }

  /**
   * Record error metrics for monitoring and analysis
   */
  private recordErrorMetrics(error: PayTabsError): void {
    if (!this.config.metricsEnabled) return;

    const existing = this.errorMetrics.get(error.type) || {
      errorType: error.type,
      totalCount: 0,
      lastOccurrence: new Date(),
      averageResolutionTime: 0,
      retrySuccessRate: 0,
      severityDistribution: {
        [PayTabsErrorSeverity.LOW]: 0,
        [PayTabsErrorSeverity.MEDIUM]: 0,
        [PayTabsErrorSeverity.HIGH]: 0,
        [PayTabsErrorSeverity.CRITICAL]: 0,
      },
    };

    existing.totalCount++;
    existing.lastOccurrence = error.timestamp;
    existing.severityDistribution[error.severity]++;

    this.errorMetrics.set(error.type, existing);
  }

  /**
   * Add error to history for analysis
   */
  private addToErrorHistory(error: PayTabsError): void {
    this.errorHistory.push(error);
    
    // Keep only last 1000 errors to prevent memory issues
    if (this.errorHistory.length > 1000) {
      this.errorHistory.splice(0, this.errorHistory.length - 1000);
    }
  }

  /**
   * Emit error event for monitoring and alerting
   */
  private async emitErrorEvent(
    error: PayTabsError, 
    context: PayTabsErrorContext, 
    correlationId: string
  ): Promise<void> {
    const errorEvent: PaymentErrorEvent = {
      id: this.generateEventId(),
      type: PaymentEventType.PAYMENT_ERROR_OCCURRED,
      timestamp: new Date(),
      version: '2.0',
      priority: this.mapSeverityToPriority(error.severity),
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      aggregateId: context.paymentId || 'unknown',
      aggregateType: 'PayTabsError',
      metadata: {
        source: 'PayTabsErrorHandlerService',
        userId: context.userId,
        traceId: this.generateTraceId(),
      },
      data: {
        paymentId: context.paymentId || 'unknown',
        errorType: error.type,
        errorCode: error.code,
        errorMessage: error.message,
        errorStack: error.details?.stack,
        context: context,
        severity: error.severity,
        recoverable: error.retryable,
        retryStrategy: this.determineRecoveryStrategy(error, context),
      },
    };

    await this.eventEmitter.emit(errorEvent.type, errorEvent);
  }

  /**
   * Check if error classification methods
   */
  private isNetworkError(error: any): boolean {
    return error.code === 'ECONNRESET' || 
           error.code === 'ECONNREFUSED' || 
           error.code === 'ETIMEDOUT' ||
           error.message?.includes('timeout') ||
           error.message?.includes('network');
  }

  private isAuthenticationError(responseData: any): boolean {
    return responseData.respCode === '401' || 
           responseData.respMessage?.toLowerCase().includes('authentication') ||
           responseData.respMessage?.toLowerCase().includes('unauthorized');
  }

  private isValidationError(responseData: any): boolean {
    return responseData.respCode === '400' ||
           responseData.respMessage?.toLowerCase().includes('validation') ||
           responseData.respMessage?.toLowerCase().includes('invalid');
  }

  private isPaymentProcessingError(responseData: any): boolean {
    return responseData.respCode && 
           responseData.respCode !== '100' && 
           responseData.respCode !== '200';
  }

  private isRateLimitError(statusCode: number): boolean {
    return statusCode === 429;
  }

  private isConfigurationError(error: any): boolean {
    return error.message?.includes('configuration') ||
           error.message?.includes('profile_id') ||
           error.message?.includes('server_key');
  }

  private isRetryableError(errorType: PayTabsErrorType): boolean {
    const retryableErrors = [
      PayTabsErrorType.NETWORK_ERROR,
      PayTabsErrorType.SERVER_ERROR,
      PayTabsErrorType.RATE_LIMIT_ERROR,
    ];
    return retryableErrors.includes(errorType);
  }

  private isRetryablePaymentError(respCode: string): boolean {
    // PayTabs specific retryable error codes
    const retryableCodes = ['503', '504', '408', '429'];
    return retryableCodes.includes(respCode);
  }

  /**
   * Map error type to HTTP status
   */
  private mapToHttpStatus(errorType: PayTabsErrorType): HttpStatus {
    const statusMap = {
      [PayTabsErrorType.NETWORK_ERROR]: HttpStatus.SERVICE_UNAVAILABLE,
      [PayTabsErrorType.AUTHENTICATION_ERROR]: HttpStatus.UNAUTHORIZED,
      [PayTabsErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
      [PayTabsErrorType.PAYMENT_PROCESSING_ERROR]: HttpStatus.PAYMENT_REQUIRED,
      [PayTabsErrorType.RATE_LIMIT_ERROR]: HttpStatus.TOO_MANY_REQUESTS,
      [PayTabsErrorType.SERVER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
      [PayTabsErrorType.CONFIGURATION_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
      [PayTabsErrorType.UNKNOWN_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
    };

    return statusMap[errorType] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Map error severity to event priority
   */
  private mapSeverityToPriority(severity: PayTabsErrorSeverity): PaymentEventPriority {
    const priorityMap = {
      [PayTabsErrorSeverity.LOW]: PaymentEventPriority.LOW,
      [PayTabsErrorSeverity.MEDIUM]: PaymentEventPriority.MEDIUM,
      [PayTabsErrorSeverity.HIGH]: PaymentEventPriority.HIGH,
      [PayTabsErrorSeverity.CRITICAL]: PaymentEventPriority.CRITICAL,
    };

    return priorityMap[severity] || PaymentEventPriority.MEDIUM;
  }

  /**
   * Check if alert should be triggered
   */
  private shouldTriggerAlert(error: PayTabsError): boolean {
    return error.severity === PayTabsErrorSeverity.CRITICAL ||
           (error.severity === PayTabsErrorSeverity.HIGH && this.getRecentErrorCount(error.type) > 5);
  }

  /**
   * Get recent error count for a specific error type
   */
  private getRecentErrorCount(errorType: PayTabsErrorType): number {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return this.errorHistory.filter(
      error => error.type === errorType && error.timestamp > fiveMinutesAgo
    ).length;
  }

  /**
   * Trigger alert for critical errors
   */
  private async triggerAlert(error: PayTabsError, context: PayTabsErrorContext): Promise<void> {
    this.logger.error(`ALERT: Critical PayTabs error - ${error.type}: ${error.message}`, {
      error,
      context,
      recentErrorCount: this.getRecentErrorCount(error.type),
    });

    // Here you could integrate with alerting systems like:
    // - Slack notifications
    // - Email alerts
    // - PagerDuty
    // - Custom webhook notifications
  }

  /**
   * Create fallback error result when error handling fails
   */
  private createFallbackErrorResult(
    error: any, 
    context: PayTabsErrorContext, 
    correlationId: string
  ): ErrorHandlingResult {
    return {
      shouldRetry: false,
      retryAfter: 0,
      retryable: false,
      errorCode: 'ERROR_HANDLING_FAILED',
      userMessage: 'An unexpected error occurred. Please try again or contact support.',
      technicalMessage: `Error handling failed: ${error.message}`,
      severity: PayTabsErrorSeverity.CRITICAL,
      recoveryStrategy: PayTabsErrorRecoveryStrategy.MANUAL_INTERVENTION,
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
      details: {
        originalError: error.message,
        context,
        handlingError: true,
      },
      correlationId,
    };
  }

  /**
   * Initialize error metrics tracking
   */
  private initializeErrorMetrics(): void {
    Object.values(PayTabsErrorType).forEach(errorType => {
      this.errorMetrics.set(errorType, {
        errorType,
        totalCount: 0,
        lastOccurrence: new Date(),
        averageResolutionTime: 0,
        retrySuccessRate: 0,
        severityDistribution: {
          [PayTabsErrorSeverity.LOW]: 0,
          [PayTabsErrorSeverity.MEDIUM]: 0,
          [PayTabsErrorSeverity.HIGH]: 0,
          [PayTabsErrorSeverity.CRITICAL]: 0,
        },
      });
    });
  }

  /**
   * Get error metrics for monitoring
   */
  getErrorMetrics(): Map<PayTabsErrorType, PayTabsErrorMetrics> {
    return new Map(this.errorMetrics);
  }

  /**
   * Get error history for analysis
   */
  getErrorHistory(limit: number = 100): PayTabsError[] {
    return this.errorHistory.slice(-limit);
  }

  /**
   * Reset error metrics (for testing or maintenance)
   */
  resetErrorMetrics(): void {
    this.errorMetrics.clear();
    this.errorHistory.length = 0;
    this.initializeErrorMetrics();
  }

  /**
   * Generate unique correlation ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
