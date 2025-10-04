/**
 * 🛡️ **ENHANCED PAYTABS RESILIENT SERVICE**
 * 
 * Advanced PayTabs integration with comprehensive error handling, circuit breaker
 * protection, intelligent retry mechanisms, and resilience patterns.
 * 
 * @author NestCMS Team
 * @version 2.0.0
 * @since 2024-01-15
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { PayTabService } from '../../paytabs.service';
import { PayTabsErrorHandlerService, ErrorHandlingResult } from './paytabs-error-handler.service';
import { EventDrivenCircuitBreakerService } from '../../circuit-breaker/event-driven-circuit-breaker.service';
import { 
  PayTabsErrorContext,
  PayTabsErrorType,
  PayTabsErrorSeverity,
  PaymentEventType,
  PaymentInitiatedEvent,
  PaymentProcessingEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  PaymentEventPriority,
  PaymentEventStatus,
} from '../interfaces/payment-types.interface';

export interface PayTabsResilientConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterEnabled: boolean;
  circuitBreakerEnabled: boolean;
  fallbackEnabled: boolean;
  healthCheckEnabled: boolean;
  healthCheckInterval: number;
  metricsEnabled: boolean;
  alertingEnabled: boolean;
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
  transactionRef?: string;
  redirectUrl?: string;
  message: string;
  respCode?: string;
  respMessage?: string;
  data?: any;
  fromFallback?: boolean;
  executionTime?: number;
  retryCount?: number;
}

export interface PayTabsVerificationRequest {
  transactionRef: string;
  paymentId?: string;
}

export interface PayTabsVerificationResponse {
  success: boolean;
  responseCode: string;
  amount: number;
  currency: string;
  message: string;
  transactionRef: string;
  status: string;
  data?: any;
  fromFallback?: boolean;
  executionTime?: number;
}

export interface PayTabsHealthStatus {
  isHealthy: boolean;
  responseTime: number;
  lastCheck: Date;
  consecutiveFailures: number;
  uptime: number;
  errorRate: number;
  circuitBreakerState: string;
}

@Injectable()
export class EnhancedPayTabsResilientService {
  private readonly logger = new Logger(EnhancedPayTabsResilientService.name);
  private readonly config: PayTabsResilientConfig;
  private healthStatus: PayTabsHealthStatus;
  private readonly healthCheckInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly httpService: HttpService,
    private readonly payTabService: PayTabService,
    private readonly errorHandler: PayTabsErrorHandlerService,
    private readonly circuitBreaker: EventDrivenCircuitBreakerService,
  ) {
    this.config = {
      maxRetries: this.configService.get<number>('PAYTABS_MAX_RETRIES', 3),
      baseDelay: this.configService.get<number>('PAYTABS_RETRY_DELAY', 1000),
      maxDelay: this.configService.get<number>('PAYTABS_MAX_RETRY_DELAY', 30000),
      backoffMultiplier: this.configService.get<number>('PAYTABS_BACKOFF_MULTIPLIER', 2),
      jitterEnabled: this.configService.get<boolean>('PAYTABS_RETRY_JITTER', true),
      circuitBreakerEnabled: this.configService.get<boolean>('PAYTABS_CIRCUIT_BREAKER_ENABLED', true),
      fallbackEnabled: this.configService.get<boolean>('PAYTABS_FALLBACK_ENABLED', true),
      healthCheckEnabled: this.configService.get<boolean>('PAYTABS_HEALTH_CHECK_ENABLED', true),
      healthCheckInterval: this.configService.get<number>('PAYTABS_HEALTH_CHECK_INTERVAL', 60000),
      metricsEnabled: this.configService.get<boolean>('PAYTABS_METRICS_ENABLED', true),
      alertingEnabled: this.configService.get<boolean>('PAYTABS_ALERTING_ENABLED', true),
    };

    this.healthStatus = {
      isHealthy: true,
      responseTime: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      uptime: 100,
      errorRate: 0,
      circuitBreakerState: 'CLOSED',
    };

    this.initializeCircuitBreaker();

    // Start health check interval
    if (this.config.healthCheckEnabled) {
      this.healthCheckInterval = setInterval(() => {
        this.performHealthCheck();
      }, this.config.healthCheckInterval);
    }
  }

  /**
   * Initialize circuit breaker for PayTabs service
   */
  private initializeCircuitBreaker(): void {
    if (this.config.circuitBreakerEnabled) {
      this.circuitBreaker.createCircuit('paytabs-resilient', {
        name: 'paytabs-resilient',
        errorThreshold: 50,
        timeout: 30000,
        resetTimeout: 60000,
        minimumRequests: 5,
        maxConcurrentRequests: 10,
        volumeThreshold: 10,
        slowCallThreshold: 15000,
        slowCallRateThreshold: 30,
        enableEventEmission: true,
        enableMetrics: true,
      });
    }
  }

  /**
   * Create payment with comprehensive error handling and resilience
   */
  async createPayment(request: PayTabsRequest, userId?: string): Promise<PayTabsResponse> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    const paymentId = this.generatePaymentId();

    const context: PayTabsErrorContext = {
      operation: 'create_payment',
      paymentId,
      userId,
      correlationId,
      retryCount: 0,
      startTime: new Date(startTime),
    };

    try {
      // Emit payment initiated event
      await this.emitPaymentInitiatedEvent(paymentId, request, correlationId, userId);

      // Execute with circuit breaker protection
      const result = await this.executeWithResilience(
        async () => {
          // Convert PayTabsRequest to Payment format expected by PayTabService
          const paymentData = {
            _id: this.generatePaymentId(),
            title: request.description,
            date: new Date(),
            status: 'pending',
            client: request.clientInfo,
            contractId: request.metadata?.contractId || 'default',
            toArrayP: async () => ({
              amount: request.amount,
              currency: request.currency,
              description: request.description,
              cart_id: this.generatePaymentId(),
            })
          };
          
          const urls = {
            callback: request.callbackUrl || '',
            return: request.redirectUrl || ''
          };
          
          return await this.payTabService.createPage(paymentData, urls);
        },
        context,
        'create_payment'
      );

      const executionTime = Date.now() - startTime;

      if (result.success) {
        // Emit payment processing event
        await this.emitPaymentProcessingEvent(paymentId, result.transactionRef || '', correlationId);

        return {
          success: true,
          transactionRef: result.transactionRef,
          redirectUrl: result.redirectUrl,
          message: result.message || 'Payment created successfully',
          respCode: result.respCode,
          respMessage: result.respMessage,
          data: result.data,
          fromFallback: result.fromFallback || false,
          executionTime,
          retryCount: context.retryCount,
        };
      } else {
        // Emit payment failed event
        await this.emitPaymentFailedEvent(
          paymentId, 
          result.message || 'Payment creation failed', 
          correlationId
        );

        return {
          success: false,
          message: result.message || 'Payment creation failed',
          respCode: result.respCode,
          respMessage: result.respMessage,
          data: result.data,
          fromFallback: result.fromFallback || false,
          executionTime,
          retryCount: context.retryCount,
        };
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Handle error with comprehensive error handler
      const errorResult = await this.errorHandler.handleError(error, context);
      
      // Emit payment failed event
      await this.emitPaymentFailedEvent(paymentId, errorResult.userMessage, correlationId);

      // If retryable and within retry limits, attempt retry
      if (errorResult.shouldRetry && context.retryCount < this.config.maxRetries) {
        this.logger.log(`Retrying payment creation (attempt ${context.retryCount + 1}/${this.config.maxRetries})`);
        
        // Wait for retry delay
        await this.delay(errorResult.retryAfter);
        
        // Increment retry count and retry
        context.retryCount++;
        return await this.createPayment(request, userId);
      }

      // Return error response
      return {
        success: false,
        message: errorResult.userMessage,
        respCode: errorResult.errorCode,
        respMessage: errorResult.technicalMessage,
        fromFallback: false,
        executionTime,
        retryCount: context.retryCount,
      };
    }
  }

  /**
   * Verify payment with resilience patterns
   */
  async verifyPayment(request: PayTabsVerificationRequest, userId?: string): Promise<PayTabsVerificationResponse> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    const context: PayTabsErrorContext = {
      operation: 'verify_payment',
      paymentId: request.paymentId,
      userId,
      correlationId,
      retryCount: 0,
      startTime: new Date(startTime),
    };

    try {
      // Execute with circuit breaker protection
      const result = await this.executeWithResilience(
        async () => {
          return await this.payTabService.payVerify(request.transactionRef);
        },
        context,
        'verify_payment'
      );

      const executionTime = Date.now() - startTime;
      const isSuccess = result.success || result.responseCode === '100';

      if (isSuccess) {
        // Emit payment completed event
        await this.emitPaymentCompletedEvent(
          request.paymentId || 'unknown',
          request.transactionRef,
          result.amount || 0,
          result.currency || 'SAR',
          correlationId
        );
      } else {
        // Emit payment failed event
        await this.emitPaymentFailedEvent(
          request.paymentId || 'unknown',
          result.message || 'Payment verification failed',
          correlationId
        );
      }

      return {
        success: isSuccess,
        responseCode: result.responseCode || result.respCode || '400',
        amount: result.amount || 0,
        currency: result.currency || 'SAR',
        message: result.message || 'Payment verification completed',
        transactionRef: request.transactionRef,
        status: isSuccess ? 'completed' : 'failed',
        data: result.data,
        fromFallback: result.fromFallback || false,
        executionTime,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Handle error with comprehensive error handler
      const errorResult = await this.errorHandler.handleError(error, context);
      
      // Emit payment failed event
      await this.emitPaymentFailedEvent(
        request.paymentId || 'unknown',
        errorResult.userMessage,
        correlationId
      );

      // If retryable and within retry limits, attempt retry
      if (errorResult.shouldRetry && context.retryCount < this.config.maxRetries) {
        this.logger.log(`Retrying payment verification (attempt ${context.retryCount + 1}/${this.config.maxRetries})`);
        
        // Wait for retry delay
        await this.delay(errorResult.retryAfter);
        
        // Increment retry count and retry
        context.retryCount++;
        return await this.verifyPayment(request, userId);
      }

      // Return error response
      return {
        success: false,
        responseCode: errorResult.errorCode,
        amount: 0,
        currency: 'SAR',
        message: errorResult.userMessage,
        transactionRef: request.transactionRef,
        status: 'failed',
        fromFallback: false,
        executionTime,
      };
    }
  }

  /**
   * Execute operation with circuit breaker and resilience patterns
   */
  private async executeWithResilience<T>(
    operation: () => Promise<T>,
    context: PayTabsErrorContext,
    operationName: string
  ): Promise<T> {
    if (this.config.circuitBreakerEnabled) {
      return await this.circuitBreaker.execute(
        'paytabs-resilient',
        operation,
        this.config.fallbackEnabled ? () => this.createFallbackResponse(context) : undefined,
        operationName
      );
    } else {
      return await operation();
    }
  }

  /**
   * Create fallback response when circuit breaker is open
   */
  private async createFallbackResponse(context: PayTabsErrorContext): Promise<any> {
    this.logger.warn(`Creating fallback response for ${context.operation}`);

    switch (context.operation) {
      case 'create_payment':
        return {
          success: false,
          message: 'Payment service is temporarily unavailable. Please try again later.',
          respCode: '503',
          respMessage: 'Service Unavailable',
          fromFallback: true,
        };

      case 'verify_payment':
        return {
          success: false,
          responseCode: '503',
          amount: 0,
          currency: 'SAR',
          message: 'Payment verification service is temporarily unavailable.',
          fromFallback: true,
        };

      default:
        return {
          success: false,
          message: 'Service temporarily unavailable',
          fromFallback: true,
        };
    }
  }

  /**
   * Perform health check on PayTabs service
   */
  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now();

    try {
      // Simple health check - attempt to create a test request (without actually processing)
      const testRequest = {
        amount: 1,
        currency: 'SAR',
        description: 'Health check',
        clientInfo: {
          name: 'Health Check',
          email: 'healthcheck@example.com',
          phone: '+966500000000',
          address: {},
        },
      };

      // This would be a dry-run or health check endpoint if available
      // For now, we'll check if the service is responsive
      const response = await firstValueFrom(
        this.httpService.get('https://secure.paytabs.sa/health', {
          timeout: 5000,
        })
      );

      const responseTime = Date.now() - startTime;
      
      this.healthStatus = {
        isHealthy: true,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: 0,
        uptime: this.calculateUptime(),
        errorRate: this.calculateErrorRate(),
        circuitBreakerState: this.getCircuitBreakerState(),
      };

      this.logger.debug(`PayTabs health check passed (${responseTime}ms)`);

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.healthStatus = {
        isHealthy: false,
        responseTime,
        lastCheck: new Date(),
        consecutiveFailures: this.healthStatus.consecutiveFailures + 1,
        uptime: this.calculateUptime(),
        errorRate: this.calculateErrorRate(),
        circuitBreakerState: this.getCircuitBreakerState(),
      };

      this.logger.warn(`PayTabs health check failed: ${error.message} (${responseTime}ms)`);

      // Trigger alert if consecutive failures exceed threshold
      if (this.healthStatus.consecutiveFailures >= 3 && this.config.alertingEnabled) {
        await this.triggerHealthAlert();
      }
    }
  }

  /**
   * Calculate service uptime percentage
   */
  private calculateUptime(): number {
    const circuitStats = this.circuitBreaker.getStats('paytabs-resilient');
    return circuitStats ? circuitStats.metrics.uptime : 100;
  }

  /**
   * Calculate error rate percentage
   */
  private calculateErrorRate(): number {
    const circuitStats = this.circuitBreaker.getStats('paytabs-resilient');
    return circuitStats ? circuitStats.metrics.errorRate : 0;
  }

  /**
   * Get circuit breaker state
   */
  private getCircuitBreakerState(): string {
    const circuitStats = this.circuitBreaker.getStats('paytabs-resilient');
    return circuitStats ? circuitStats.state : 'UNKNOWN';
  }

  /**
   * Trigger health alert
   */
  private async triggerHealthAlert(): Promise<void> {
    this.logger.error(`PayTabs service health alert: ${this.healthStatus.consecutiveFailures} consecutive failures`);
    
    // Here you could integrate with alerting systems
    // - Send Slack notification
    // - Send email alert
    // - Trigger PagerDuty incident
    // - Custom webhook notification
  }

  /**
   * Emit payment events
   */
  private async emitPaymentInitiatedEvent(
    paymentId: string,
    request: PayTabsRequest,
    correlationId: string,
    userId?: string
  ): Promise<void> {
    const event: PaymentInitiatedEvent = {
      id: this.generateEventId(),
      type: PaymentEventType.PAYMENT_INITIATED,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.HIGH,
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      aggregateId: paymentId,
      aggregateType: 'Payment',
      metadata: {
        source: 'EnhancedPayTabsResilientService',
        userId,
        traceId: this.generateTraceId(),
      },
      data: {
        paymentId,
        contractId: request.metadata?.contractId || 'unknown',
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        clientInfo: request.clientInfo,
        paymentMethod: 'card',
        redirectUrl: request.redirectUrl,
        callbackUrl: request.callbackUrl,
      },
    };

    await this.eventEmitter.emit(event.type, event);
  }

  private async emitPaymentProcessingEvent(
    paymentId: string,
    transactionRef: string,
    correlationId: string
  ): Promise<void> {
    const event: PaymentProcessingEvent = {
      id: this.generateEventId(),
      type: PaymentEventType.PAYMENT_PROCESSING,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.MEDIUM,
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      aggregateId: paymentId,
      aggregateType: 'Payment',
      metadata: {
        source: 'EnhancedPayTabsResilientService',
        traceId: this.generateTraceId(),
      },
      data: {
        paymentId,
        transactionRef,
        gatewayProvider: 'paytabs',
        processingStartTime: new Date(),
      },
    };

    await this.eventEmitter.emit(event.type, event);
  }

  private async emitPaymentCompletedEvent(
    paymentId: string,
    transactionRef: string,
    amount: number,
    currency: string,
    correlationId: string
  ): Promise<void> {
    const event: PaymentCompletedEvent = {
      id: this.generateEventId(),
      type: PaymentEventType.PAYMENT_COMPLETED,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.HIGH,
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      aggregateId: paymentId,
      aggregateType: 'Payment',
      metadata: {
        source: 'EnhancedPayTabsResilientService',
        traceId: this.generateTraceId(),
      },
      data: {
        paymentId,
        transactionRef,
        amount,
        currency,
        gatewayResponse: {},
        completedAt: new Date(),
        processingDuration: 0,
      },
    };

    await this.eventEmitter.emit(event.type, event);
  }

  private async emitPaymentFailedEvent(
    paymentId: string,
    errorMessage: string,
    correlationId: string
  ): Promise<void> {
    const event: PaymentFailedEvent = {
      id: this.generateEventId(),
      type: PaymentEventType.PAYMENT_FAILED,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.HIGH,
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      aggregateId: paymentId,
      aggregateType: 'Payment',
      metadata: {
        source: 'EnhancedPayTabsResilientService',
        traceId: this.generateTraceId(),
      },
      data: {
        paymentId,
        errorCode: 'PAYMENT_FAILED',
        errorMessage,
        errorDetails: {},
        failedAt: new Date(),
        retryable: false,
        retryCount: 0,
      },
    };

    await this.eventEmitter.emit(event.type, event);
  }

  /**
   * Utility methods
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get health status
   */
  getHealthStatus(): PayTabsHealthStatus {
    return { ...this.healthStatus };
  }

  /**
   * Get error metrics
   */
  getErrorMetrics() {
    return this.errorHandler.getErrorMetrics();
  }

  /**
   * Get circuit breaker stats
   */
  getCircuitBreakerStats() {
    return this.circuitBreaker.getStats('paytabs-resilient');
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset('paytabs-resilient');
  }

  /**
   * Cleanup on service shutdown
   */
  onModuleDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Generate unique IDs
   */
  private generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
