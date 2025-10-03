/**
 * 🎯 **EVENT-DRIVEN PAYMENT SERVICE**
 * 
 * Comprehensive event-driven payment service with circuit breaker protection,
 * event sourcing, saga patterns, and resilience mechanisms.
 * 
 * @author NestCMS Team
 * @version 2.0.0
 * @since 2024-01-15
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  PaymentEvent,
  PaymentEventType,
  PaymentEventPriority,
  PaymentEventStatus,
  PaymentInitiatedEvent,
  PaymentProcessingEvent,
  PaymentCompletedEvent,
  PaymentFailedEvent,
  WebhookReceivedEvent,
  PaymentErrorEvent,
  PaymentAuditEvent,
} from '../../events/payment-events.interface';
import { EventDrivenCircuitBreakerService } from '../../circuit-breaker/event-driven-circuit-breaker.service';
import { PayTabService } from '../../paytabs.service';
import { Payment } from '../models/payment.schema';

export interface PaymentRequest {
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
  paymentMethod?: string;
  redirectUrl?: string;
  callbackUrl?: string;
  metadata?: Record<string, any>;
}

export interface PaymentResult {
  paymentId: string;
  transactionRef?: string;
  redirectUrl?: string;
  status: string;
  message: string;
  events: PaymentEvent[];
  fromFallback: boolean;
  executionTime: number;
}

export interface PaymentVerificationResult {
  valid: boolean;
  transactionRef: string;
  status: string;
  amount: number;
  currency: string;
  message: string;
  events: PaymentEvent[];
}

@Injectable()
export class EventDrivenPaymentService {
  private readonly logger = new Logger(EventDrivenPaymentService.name);
  private readonly paymentSagas = new Map<string, PaymentSaga>();

  constructor(
    @InjectModel('Payment') private readonly paymentModel: Model<Payment>,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly circuitBreakerService: EventDrivenCircuitBreakerService,
    private readonly payTabService: PayTabService,
  ) {
    this.initializeCircuitBreakers();
  }

  /**
   * Initialize circuit breakers for external services
   */
  private initializeCircuitBreakers(): void {
    // PayTabs API circuit breaker
    this.circuitBreakerService.createCircuit('paytabs-api', {
      name: 'paytabs-api',
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

    // Database circuit breaker
    this.circuitBreakerService.createCircuit('payment-database', {
      name: 'payment-database',
      errorThreshold: 30,
      timeout: 10000,
      resetTimeout: 30000,
      minimumRequests: 10,
      maxConcurrentRequests: 20,
      volumeThreshold: 20,
      slowCallThreshold: 5000,
      slowCallRateThreshold: 40,
      enableEventEmission: true,
      enableMetrics: true,
    });

    this.logger.log('Circuit breakers initialized for event-driven payment service');
  }

  /**
   * Create payment with event-driven architecture and circuit breaker protection
   */
  async createPayment(request: PaymentRequest, userId?: string): Promise<PaymentResult> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();
    const paymentId = this.generatePaymentId();
    const events: PaymentEvent[] = [];

    try {
      // Emit payment initiated event
      const initiatedEvent = this.createPaymentInitiatedEvent(
        paymentId,
        request,
        correlationId,
        userId
      );
      events.push(initiatedEvent);
      await this.emitEvent(initiatedEvent);

      // Start payment saga
      const saga = new PaymentProcessingSaga(paymentId, correlationId);
      this.paymentSagas.set(paymentId, saga);

      // Save payment to database with circuit breaker protection
      const payment = await this.circuitBreakerService.execute(
        'payment-database',
        async () => {
          const newPayment = new this.paymentModel({
            _id: paymentId,
            contractId: request.contractId,
            amount: request.amount,
            currency: request.currency,
            description: request.description,
            clientInfo: request.clientInfo,
            paymentMethod: request.paymentMethod || 'card',
            status: 'initiated',
            metadata: request.metadata || {},
            events: [initiatedEvent.id],
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          return await newPayment.save();
        },
        async () => {
          // Fallback: return mock payment object
          this.logger.warn('Database unavailable, using fallback for payment creation');
          return {
            _id: paymentId,
            contractId: request.contractId,
            amount: request.amount,
            currency: request.currency,
            status: 'initiated',
          } as any;
        },
        'create_payment'
      );

      // Emit payment processing event
      const processingEvent = this.createPaymentProcessingEvent(
        paymentId,
        correlationId,
        initiatedEvent.id
      );
      events.push(processingEvent);
      await this.emitEvent(processingEvent);

      // Create PayTabs payment with circuit breaker protection
      const payTabsResult = await this.circuitBreakerService.execute(
        'paytabs-api',
        async () => {
          return await this.payTabService.createPayment({
            amount: request.amount,
            currency: request.currency,
            description: request.description,
            clientInfo: request.clientInfo,
            redirectUrl: request.redirectUrl,
            callbackUrl: request.callbackUrl,
          });
        },
        async () => {
          // Fallback: return mock response
          this.logger.warn('PayTabs API unavailable, using fallback response');
          return {
            success: false,
            message: 'Payment gateway temporarily unavailable',
            fallback: true,
          };
        },
        'create_paytabs_payment'
      );

      const executionTime = Date.now() - startTime;

      if (payTabsResult.fromFallback || !payTabsResult.result.success) {
        // Handle failure or fallback
        const failedEvent = this.createPaymentFailedEvent(
          paymentId,
          payTabsResult.result.message || 'Payment creation failed',
          correlationId,
          processingEvent.id
        );
        events.push(failedEvent);
        await this.emitEvent(failedEvent);

        // Update payment status
        if (!payment.fromFallback) {
          await this.updatePaymentStatus(paymentId, 'failed', failedEvent.id);
        }

        return {
          paymentId,
          status: 'failed',
          message: payTabsResult.result.message || 'Payment creation failed',
          events,
          fromFallback: payTabsResult.fromFallback,
          executionTime,
        };
      }

      // Success case
      const transactionRef = payTabsResult.result.transactionRef || payTabsResult.result.tran_ref;
      const redirectUrl = payTabsResult.result.redirectUrl || payTabsResult.result.redirect_url;

      // Update payment with transaction reference
      if (!payment.fromFallback) {
        await this.updatePaymentWithTransactionRef(paymentId, transactionRef, 'processing');
      }

      // Emit audit event
      const auditEvent = this.createPaymentAuditEvent(
        paymentId,
        'payment_created',
        { status: 'processing', transactionRef },
        correlationId,
        userId
      );
      events.push(auditEvent);
      await this.emitEvent(auditEvent);

      return {
        paymentId,
        transactionRef,
        redirectUrl,
        status: 'processing',
        message: 'Payment created successfully',
        events,
        fromFallback: payTabsResult.fromFallback,
        executionTime,
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      // Emit error event
      const errorEvent = this.createPaymentErrorEvent(
        paymentId,
        error,
        correlationId
      );
      events.push(errorEvent);
      await this.emitEvent(errorEvent);

      // Complete saga with error
      const saga = this.paymentSagas.get(paymentId);
      if (saga) {
        await saga.compensate();
        this.paymentSagas.delete(paymentId);
      }

      throw error;
    }
  }

  /**
   * Verify payment with event-driven architecture
   */
  async verifyPayment(paymentId: string, transactionRef: string): Promise<PaymentVerificationResult> {
    const correlationId = this.generateCorrelationId();
    const events: PaymentEvent[] = [];

    try {
      // Verify with PayTabs using circuit breaker
      const verificationResult = await this.circuitBreakerService.execute(
        'paytabs-api',
        async () => {
          return await this.payTabService.verifyPayment(transactionRef);
        },
        async () => {
          // Fallback: check local database
          this.logger.warn('PayTabs API unavailable, checking local database');
          const payment = await this.paymentModel.findById(paymentId);
          return {
            success: payment?.status === 'completed',
            responseCode: payment?.status === 'completed' ? '100' : '400',
            amount: payment?.amount || 0,
            currency: payment?.currency || 'SAR',
            message: 'Verification from local database',
            fallback: true,
          };
        },
        'verify_payment'
      );

      const isSuccess = verificationResult.result.success || verificationResult.result.responseCode === '100';
      const status = isSuccess ? 'completed' : 'failed';

      // Update payment status
      await this.updatePaymentStatus(paymentId, status);

      // Emit appropriate event
      if (isSuccess) {
        const completedEvent = this.createPaymentCompletedEvent(
          paymentId,
          transactionRef,
          verificationResult.result.amount || 0,
          verificationResult.result.currency || 'SAR',
          correlationId
        );
        events.push(completedEvent);
        await this.emitEvent(completedEvent);
      } else {
        const failedEvent = this.createPaymentFailedEvent(
          paymentId,
          verificationResult.result.message || 'Payment verification failed',
          correlationId
        );
        events.push(failedEvent);
        await this.emitEvent(failedEvent);
      }

      // Complete saga
      const saga = this.paymentSagas.get(paymentId);
      if (saga) {
        await saga.complete();
        this.paymentSagas.delete(paymentId);
      }

      return {
        valid: isSuccess,
        transactionRef,
        status,
        amount: verificationResult.result.amount || 0,
        currency: verificationResult.result.currency || 'SAR',
        message: verificationResult.result.message || 'Payment verification completed',
        events,
      };

    } catch (error) {
      // Emit error event
      const errorEvent = this.createPaymentErrorEvent(paymentId, error, correlationId);
      events.push(errorEvent);
      await this.emitEvent(errorEvent);

      throw error;
    }
  }

  /**
   * Handle webhook with event-driven processing
   */
  async handleWebhook(payload: any, signature: string, timestamp: string, ipAddress: string): Promise<void> {
    const correlationId = this.generateCorrelationId();
    const webhookId = this.generateWebhookId();

    // Emit webhook received event
    const webhookEvent: WebhookReceivedEvent = {
      id: this.generateEventId(),
      type: PaymentEventType.WEBHOOK_RECEIVED,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.HIGH,
      status: PaymentEventStatus.PROCESSING,
      correlationId,
      aggregateId: webhookId,
      aggregateType: 'Webhook',
      metadata: {
        source: 'EventDrivenPaymentService',
        ipAddress,
        traceId: this.generateTraceId(),
      },
      data: {
        webhookId,
        paymentId: payload.cart_id,
        transactionRef: payload.tran_ref,
        provider: 'paytabs',
        payload,
        signature,
        timestamp,
        ipAddress,
        headers: {},
      },
    };

    await this.emitEvent(webhookEvent);

    // Process webhook payload
    if (payload.cart_id && payload.tran_ref) {
      await this.verifyPayment(payload.cart_id, payload.tran_ref);
    }
  }

  /**
   * Event handlers for payment lifecycle events
   */
  @OnEvent(PaymentEventType.PAYMENT_INITIATED)
  async handlePaymentInitiated(event: PaymentInitiatedEvent): Promise<void> {
    this.logger.log(`Payment initiated: ${event.data.paymentId}`);
    // Additional processing logic here
  }

  @OnEvent(PaymentEventType.PAYMENT_COMPLETED)
  async handlePaymentCompleted(event: PaymentCompletedEvent): Promise<void> {
    this.logger.log(`Payment completed: ${event.data.paymentId}`);
    
    // Update contract status, trigger earnings calculation, etc.
    // This is where you'd integrate with other business processes
  }

  @OnEvent(PaymentEventType.PAYMENT_FAILED)
  async handlePaymentFailed(event: PaymentFailedEvent): Promise<void> {
    this.logger.warn(`Payment failed: ${event.data.paymentId} - ${event.data.errorMessage}`);
    
    // Handle failure logic: notifications, retries, etc.
  }

  @OnEvent(PaymentEventType.CIRCUIT_BREAKER_OPENED)
  async handleCircuitBreakerOpened(event: any): Promise<void> {
    this.logger.error(`Circuit breaker opened for service: ${event.data.serviceName}`);
    
    // Implement alerting, fallback activation, etc.
  }

  /**
   * Create payment initiated event
   */
  private createPaymentInitiatedEvent(
    paymentId: string,
    request: PaymentRequest,
    correlationId: string,
    userId?: string
  ): PaymentInitiatedEvent {
    return {
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
        source: 'EventDrivenPaymentService',
        userId,
        traceId: this.generateTraceId(),
      },
      data: {
        paymentId,
        contractId: request.contractId,
        amount: request.amount,
        currency: request.currency,
        description: request.description,
        clientInfo: request.clientInfo,
        paymentMethod: request.paymentMethod || 'card',
        redirectUrl: request.redirectUrl,
        callbackUrl: request.callbackUrl,
      },
    };
  }

  /**
   * Create payment processing event
   */
  private createPaymentProcessingEvent(
    paymentId: string,
    correlationId: string,
    causationId: string
  ): PaymentProcessingEvent {
    return {
      id: this.generateEventId(),
      type: PaymentEventType.PAYMENT_PROCESSING,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.MEDIUM,
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      causationId,
      aggregateId: paymentId,
      aggregateType: 'Payment',
      metadata: {
        source: 'EventDrivenPaymentService',
        traceId: this.generateTraceId(),
      },
      data: {
        paymentId,
        transactionRef: '',
        gatewayProvider: 'paytabs',
        processingStartTime: new Date(),
      },
    };
  }

  /**
   * Create payment completed event
   */
  private createPaymentCompletedEvent(
    paymentId: string,
    transactionRef: string,
    amount: number,
    currency: string,
    correlationId: string
  ): PaymentCompletedEvent {
    return {
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
        source: 'EventDrivenPaymentService',
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
  }

  /**
   * Create payment failed event
   */
  private createPaymentFailedEvent(
    paymentId: string,
    errorMessage: string,
    correlationId: string,
    causationId?: string
  ): PaymentFailedEvent {
    return {
      id: this.generateEventId(),
      type: PaymentEventType.PAYMENT_FAILED,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.HIGH,
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      causationId,
      aggregateId: paymentId,
      aggregateType: 'Payment',
      metadata: {
        source: 'EventDrivenPaymentService',
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
  }

  /**
   * Create payment error event
   */
  private createPaymentErrorEvent(
    paymentId: string,
    error: Error,
    correlationId: string
  ): PaymentErrorEvent {
    return {
      id: this.generateEventId(),
      type: PaymentEventType.PAYMENT_ERROR_OCCURRED,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.CRITICAL,
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      aggregateId: paymentId,
      aggregateType: 'Payment',
      metadata: {
        source: 'EventDrivenPaymentService',
        traceId: this.generateTraceId(),
      },
      data: {
        paymentId,
        errorType: error.constructor.name,
        errorCode: 'PAYMENT_ERROR',
        errorMessage: error.message,
        errorStack: error.stack,
        context: {},
        severity: 'HIGH',
        recoverable: false,
      },
    };
  }

  /**
   * Create payment audit event
   */
  private createPaymentAuditEvent(
    paymentId: string,
    action: string,
    changes: any,
    correlationId: string,
    userId?: string
  ): PaymentAuditEvent {
    return {
      id: this.generateEventId(),
      type: PaymentEventType.PAYMENT_AUDIT_LOG,
      timestamp: new Date(),
      version: '2.0',
      priority: PaymentEventPriority.LOW,
      status: PaymentEventStatus.COMPLETED,
      correlationId,
      aggregateId: paymentId,
      aggregateType: 'Payment',
      metadata: {
        source: 'EventDrivenPaymentService',
        userId,
        traceId: this.generateTraceId(),
      },
      data: {
        action,
        resource: 'Payment',
        resourceId: paymentId,
        newValues: changes,
        changes: Object.keys(changes),
        performedBy: userId || 'system',
        performedAt: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'EventDrivenPaymentService',
      },
    };
  }

  /**
   * Emit event to event bus
   */
  private async emitEvent(event: PaymentEvent): Promise<void> {
    await this.eventEmitter.emit(event.type, event);
  }

  /**
   * Update payment status in database
   */
  private async updatePaymentStatus(paymentId: string, status: string, eventId?: string): Promise<void> {
    const updateData: any = { status, updatedAt: new Date() };
    if (eventId) {
      updateData.$push = { events: eventId };
    }

    await this.paymentModel.findByIdAndUpdate(paymentId, updateData);
  }

  /**
   * Update payment with transaction reference
   */
  private async updatePaymentWithTransactionRef(
    paymentId: string, 
    transactionRef: string, 
    status: string
  ): Promise<void> {
    await this.paymentModel.findByIdAndUpdate(paymentId, {
      transactionRef,
      status,
      updatedAt: new Date(),
    });
  }

  /**
   * Generate unique payment ID
   */
  private generatePaymentId(): string {
    return `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique webhook ID
   */
  private generateWebhookId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate trace ID
   */
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Payment Processing Saga
 */
class PaymentProcessingSaga {
  public isCompleted = false;
  private steps: string[] = [];

  constructor(
    public readonly sagaId: string,
    public readonly correlationId: string,
  ) {}

  async handle(event: PaymentEvent): Promise<PaymentEvent[]> {
    this.steps.push(event.type);
    // Implement saga logic here
    return [];
  }

  async compensate(): Promise<PaymentEvent[]> {
    // Implement compensation logic here
    return [];
  }

  async complete(): Promise<void> {
    this.isCompleted = true;
  }
}
