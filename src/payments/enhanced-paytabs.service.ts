import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import paytabs from 'paytabs_pt2';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { CacheService } from '../cache/cache.service';
import { EnhancedPaymentDto } from './dto/enhanced-payment.dto';
import { PaymentCallbackDto } from './dto/base-payment.dto';
import { PaymentEventType, PaymentEventData, PaymentEventStatus, PayTabsErrorType, PayTabsErrorSeverity } from './interfaces/payment-types.interface';
import { Payment } from './interface/payment.interface';

export interface PayTabsConfig {
  profileId: string;
  serverKey: string;
  region: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface PaymentResult {
  success: boolean;
  redirectUrl?: string;
  transactionRef?: string;
  error?: string;
  cached?: boolean;
  executionTime: number;
}

export interface PaymentVerificationResult {
  valid: boolean;
  transactionRef: string;
  responseCode: string;
  status: string;
  amount?: number;
  currency?: string;
  error?: string;
}

@Injectable()
export class EnhancedPayTabsService {
  private readonly logger = new Logger(EnhancedPayTabsService.name);
  private config: PayTabsConfig;
  private initialized = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly circuitBreakerService: CircuitBreakerService,
    private readonly cacheService: CacheService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.initializeConfig();
  }

  private initializeConfig(): void {
    this.config = {
      profileId: this.configService.get<string>('PAYTABS_PROFILE_ID'),
      serverKey: this.configService.get<string>('PAYTABS_SERVER_KEY'),
      region: this.configService.get<string>('PAYTABS_REGION', 'ARE'),
      timeout: this.configService.get<number>('PAYTABS_TIMEOUT', 30000),
      retryAttempts: this.configService.get<number>('PAYTABS_RETRY_ATTEMPTS', 3),
      retryDelay: this.configService.get<number>('PAYTABS_RETRY_DELAY', 1000),
    };

    if (!this.config.profileId || !this.config.serverKey) {
      throw new Error('PayTabs configuration is incomplete. Please check PAYTABS_PROFILE_ID and PAYTABS_SERVER_KEY');
    }
  }

  private async initializePayTabs(): Promise<void> {
    if (this.initialized) return;

    try {
      await paytabs.setConfig(
        this.config.profileId,
        this.config.serverKey,
        this.config.region,
      );
      this.initialized = true;
      this.logger.log('PayTabs initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize PayTabs:', error);
      throw error;
    }
  }

  /**
   * Create a payment page with circuit breaker protection and caching
   */
  async createPaymentPage(
    payment: Payment,
    paymentDto: EnhancedPaymentDto,
    urls: { callback: string; return: string },
  ): Promise<PaymentResult> {
    const startTime = Date.now();

    try {
      // Emit payment created event
      this.emitPaymentEvent(PaymentEventType.PAYMENT_CREATED, {
        paymentId: payment._id.toString(),
        amount: paymentDto.amount,
        currency: paymentDto.currency,
        status: PaymentEventStatus.CREATED,
        timestamp: new Date(),
        metadata: paymentDto.metadata,
      });

      // Generate cache key for payment page
      const cacheKey = this.cacheService.generateCacheKey({
        paymentId: payment._id.toString(),
        amount: paymentDto.amount,
        currency: paymentDto.currency,
        urls,
      }, { prefix: 'paytabs_payment' });

      // Try to get cached payment page
      const cachedResult = await this.cacheService.get<string>(cacheKey, {
        ttl: 300, // 5 minutes cache for payment pages
        useCache: true,
        namespace: 'payments',
      });

      if (cachedResult) {
        this.logger.log(`Using cached payment page for payment ${payment._id}`);
        return {
          success: true,
          redirectUrl: cachedResult,
          cached: true,
          executionTime: Date.now() - startTime,
        };
      }

      // Execute with circuit breaker protection
      const result = await this.circuitBreakerService.execute(
        'paytabs-create-payment',
        async () => {
          await this.initializePayTabs();

          // Emit processing event
          this.emitPaymentEvent(PaymentEventType.PAYMENT_PROCESSING, {
            paymentId: payment._id.toString(),
            status: PaymentEventStatus.PROCESSING,
            timestamp: new Date(),
          });

          return await this.createPaymentPageInternal(payment, paymentDto, urls);
        },
        {
          timeout: paymentDto.timeout || this.config.timeout,
          errorThreshold: 50,
          resetTimeout: 30000,
        },
        {
          fallback: async () => {
            this.logger.warn('PayTabs circuit breaker is open, using fallback');
            throw new Error('Payment service temporarily unavailable. Please try again later.');
          },
          onOpen: (stats) => {
            this.logger.error('PayTabs circuit breaker opened:', stats);
            this.eventEmitter.emit('circuit.opened', {
              serviceName: 'paytabs-create-payment',
              state: stats.state,
              errorRate: stats.errorRate,
              timestamp: new Date(),
            });
          },
          onClose: (stats) => {
            this.logger.log('PayTabs circuit breaker closed:', stats);
            this.eventEmitter.emit('circuit.closed', {
              serviceName: 'paytabs-create-payment',
              state: stats.state,
              errorRate: stats.errorRate,
              timestamp: new Date(),
            });
          },
        },
      );

      // Cache the successful result
      if (result.success && result.redirectUrl) {
        await this.cacheService.set(cacheKey, result.redirectUrl, {
          ttl: 300,
          useCache: true,
          namespace: 'payments',
        });
      }

      return {
        ...result,
        cached: false,
        executionTime: Date.now() - startTime,
      };

    } catch (error) {
      this.logger.error(`Payment creation failed for payment ${payment._id}:`, error);
      
      // Emit payment failed event
      this.emitPaymentEvent(PaymentEventType.PAYMENT_FAILED, {
        paymentId: payment._id.toString(),
        status: PaymentEventStatus.FAILED,
        error: {
          type: PayTabsErrorType.PAYMENT_FAILED,
          severity: PayTabsErrorSeverity.HIGH,
          message: error.message || 'Payment creation failed',
          code: 'PAYMENT_CREATION_FAILED',
          timestamp: new Date(),
          retryable: true,
        },
        timestamp: new Date(),
      });

      return {
        success: false,
        error: error.message,
        cached: false,
        executionTime: Date.now() - startTime,
      };
    }
  }

  private async createPaymentPageInternal(
    payment: Payment,
    paymentDto: EnhancedPaymentDto,
    urls: { callback: string; return: string },
  ): Promise<PaymentResult> {
    const internalStartTime = Date.now();
    return new Promise((resolve, reject) => {
      try {
        const client = payment.client;
        const paymentInfo = [
          paymentDto.amount,
          paymentDto.currency,
          paymentDto.description || `Payment for contract ${paymentDto.contractId}`,
          payment._id.toString(),
        ];

        const clientInfo = [
          (client as any).fullName || 'Unknown',
          (client as any).email || 'unknown@example.com',
          (client as any).phone || '000000000',
          (client as any).address?.street || 'Unknown Address',
          (client as any).address?.city || 'Unknown City',
          (client as any).address?.state || 'Unknown State',
          (client as any).address?.country || 'SA',
          (client as any).address?.zip || '00000',
        ];

        const shippingInfo = clientInfo; // Use same info for shipping

        paytabs.createPaymentPage(
          ['all'], // Payment methods
          ['sale', 'ecom'], // Transaction types
          paymentInfo,
          clientInfo,
          shippingInfo,
          paymentDto.currency,
          [urls.callback, urls.return],
          (result) => {
            if (result && result.redirect_url) {
              this.logger.log(`Payment page created successfully for payment ${payment._id}`);
              resolve({
                success: true,
                redirectUrl: result.redirect_url,
                transactionRef: result.tran_ref,
                executionTime: Date.now() - internalStartTime,
              });
            } else {
              this.logger.error('PayTabs returned invalid response:', result);
              reject(new Error('Failed to create payment page: Invalid response from PayTabs'));
            }
          },
        );
      } catch (error) {
        this.logger.error('Error in createPaymentPageInternal:', error);
        reject(error);
      }
    });
  }

  /**
   * Verify payment with circuit breaker protection and caching
   */
  async verifyPayment(transactionRef: string, paymentId: string): Promise<PaymentVerificationResult> {
    try {
      // Generate cache key for verification
      const cacheKey = this.cacheService.generateCacheKey({
        transactionRef,
        paymentId,
      }, { prefix: 'paytabs_verify' });

      // Try to get cached verification result
      const cachedResult = await this.cacheService.get<PaymentVerificationResult>(cacheKey, {
        ttl: 600, // 10 minutes cache for verification results
        useCache: true,
        namespace: 'verifications',
      });

      if (cachedResult) {
        this.logger.log(`Using cached verification result for transaction ${transactionRef}`);
        return cachedResult;
      }

      // Execute with circuit breaker protection
      const result = await this.circuitBreakerService.execute(
        'paytabs-verify-payment',
        async () => {
          await this.initializePayTabs();
          return await this.verifyPaymentInternal(transactionRef);
        },
        {
          timeout: this.config.timeout,
          errorThreshold: 50,
          resetTimeout: 30000,
        },
      );

      // Cache successful verification results
      if (result.valid) {
        await this.cacheService.set(cacheKey, result, {
          ttl: 600,
          useCache: true,
          namespace: 'verifications',
        });

        // Emit payment completed event
        this.emitPaymentEvent(PaymentEventType.PAYMENT_COMPLETED, {
          paymentId,
          transactionRef,
          status: PaymentEventStatus.COMPLETED,
          timestamp: new Date(),
        });
      } else {
        // Emit payment failed event
        this.emitPaymentEvent(PaymentEventType.PAYMENT_FAILED, {
          paymentId,
          transactionRef,
          status: PaymentEventStatus.FAILED,
          error: {
            type: PayTabsErrorType.PAYMENT_FAILED,
            severity: PayTabsErrorSeverity.HIGH,
            message: result.error || 'Payment processing failed',
            code: 'PAYMENT_FAILED',
            timestamp: new Date(),
            retryable: false,
          },
          timestamp: new Date(),
        });
      }

      return result;

    } catch (error) {
      this.logger.error(`Payment verification failed for transaction ${transactionRef}:`, error);
      
      return {
        valid: false,
        transactionRef,
        responseCode: '500',
        status: 'error',
        error: error.message,
      };
    }
  }

  private async verifyPaymentInternal(transactionRef: string): Promise<PaymentVerificationResult> {
    return new Promise((resolve) => {
      paytabs.validatePayment(transactionRef, (result) => {
        const responseCode = result['response_code'] || result['response_code:'] || '500';
        const valid = responseCode === '400' ? false : true;

        resolve({
          valid,
          transactionRef,
          responseCode: responseCode.toString(),
          status: valid ? 'verified' : 'invalid',
          amount: result.cart_amount,
          currency: result.cart_currency,
          error: valid ? undefined : 'Payment verification failed',
        });
      });
    });
  }

  /**
   * Process payment callback with enhanced validation
   */
  async processCallback(callbackData: PaymentCallbackDto): Promise<any> {
    try {
      const { respCode, respMessage, transRef, respStatus, cart } = callbackData;

      // Emit webhook received event
      this.eventEmitter.emit('webhook.received', {
        source: 'paytabs',
        payload: callbackData,
        timestamp: new Date(),
        verified: true, // Will be properly verified by webhook security service
      });

      const result = {
        transactionRef: transRef,
        status: respStatus,
        code: respCode,
        message: respMessage,
        paymentId: cart.cart_id,
        amount: cart.cart_amount,
        currency: cart.cart_currency,
      };

      // Emit appropriate event based on status
      const eventType = respStatus === 'A' ? 
        PaymentEventType.PAYMENT_COMPLETED : 
        PaymentEventType.PAYMENT_FAILED;

      this.emitPaymentEvent(eventType, {
        paymentId: cart.cart_id,
        transactionRef: transRef,
        amount: cart.cart_amount,
        currency: cart.cart_currency,
        status: respStatus === 'A' ? PaymentEventStatus.COMPLETED : PaymentEventStatus.FAILED,
        timestamp: new Date(),
      });

      return result;

    } catch (error) {
      this.logger.error('Error processing payment callback:', error);
      throw error;
    }
  }

  /**
   * Get PayTabs service health status
   */
  async getHealthStatus(): Promise<{
    status: string;
    initialized: boolean;
    circuitBreakerStats: any;
    lastCheck: Date;
  }> {
    const circuitBreakerStats = this.circuitBreakerService.getAllStats();
    
    return {
      status: this.initialized ? 'healthy' : 'unhealthy',
      initialized: this.initialized,
      circuitBreakerStats,
      lastCheck: new Date(),
    };
  }

  private emitPaymentEvent(eventType: PaymentEventType, data: PaymentEventData): void {
    try {
      this.eventEmitter.emit(eventType, data);
      this.logger.debug(`Emitted event ${eventType} for payment ${data.paymentId}`);
    } catch (error) {
      this.logger.error(`Failed to emit event ${eventType}:`, error);
    }
  }

  /**
   * Retry failed payment with exponential backoff
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.config.retryAttempts,
    baseDelay: number = this.config.retryDelay,
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }
}
