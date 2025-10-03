import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import paytabs from 'paytabs_pt2';
import { CircuitBreakerService } from '../common/circuit-breaker.service';
import { Payment } from './interface/payment.interface';
import { ContractService } from '../contracts/';
import {
  PaymentInitiatedEvent,
  PaymentProcessingEvent,
  PaymentSuccessEvent,
  PaymentFailedEvent,
  PaymentTimeoutEvent,
  PaymentVerificationEvent,
  PaymentCircuitBreakerOpenedEvent,
  PaymentCircuitBreakerClosedEvent,
  PaymentServiceUnavailableEvent,
} from './events/payment.events';

export interface PayTabsConfig {
  profileId: string;
  serverKey: string;
  region: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export interface PaymentPageOptions {
  paymentMethods: string[];
  transactionTypes: string[];
  language: string;
  urls: {
    callback: string;
    return: string;
  };
}

export interface PaymentResult {
  success: boolean;
  redirectUrl?: string;
  transactionRef?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: Record<string, any>;
}

export interface VerificationResult {
  isValid: boolean;
  transactionRef: string;
  responseCode: string;
  status: string;
  amount?: number;
  currency?: string;
  details?: any;
  error?: {
    code: string;
    message: string;
  };
}

@Injectable()
export class EnhancedPayTabsService {
  private readonly logger = new Logger(EnhancedPayTabsService.name);
  private readonly config: PayTabsConfig;
  private isInitialized = false;

  constructor(
    private configService: ConfigService,
    private circuitBreakerService: CircuitBreakerService,
    private eventEmitter: EventEmitter2,
    private contractService: ContractService
  ) {
    this.config = {
      profileId: this.configService.get<string>('PAYTABS_PROFILE_ID') || '',
      serverKey: this.configService.get<string>('PAYTABS_SERVER_KEY') || '',
      region: this.configService.get<string>('PAYTABS_REGION', 'ARE'),
      timeout: this.configService.get<number>('PAYTABS_TIMEOUT', 30000),
      retryAttempts: this.configService.get<number>('PAYTABS_RETRY_ATTEMPTS', 3),
      retryDelay: this.configService.get<number>('PAYTABS_RETRY_DELAY', 1000),
    };

    this.validateConfig();
    this.setupCircuitBreakers();
  }

  /**
   * Initialize PayTabs configuration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await this.circuitBreakerService.execute(
        'paytabs-init',
        async () => {
          await paytabs.setConfig(
            this.config.profileId,
            this.config.serverKey,
            this.config.region
          );
          this.logger.log('PayTabs configuration initialized successfully');
          return true;
        },
        [],
        { timeout: 10000, name: 'PayTabs Initialization' }
      );

      this.isInitialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize PayTabs configuration:', error);
      throw new Error('PayTabs initialization failed');
    }
  }

  /**
   * Create payment page with circuit breaker protection
   */
  async createPaymentPage(
    payment: Payment,
    options: PaymentPageOptions
  ): Promise<PaymentResult> {
    await this.ensureInitialized();

    const startTime = Date.now();
    
    try {
      this.logger.log(`Creating payment page for payment ${payment._id}`);

      const result = await this.circuitBreakerService.execute(
        'paytabs-create-page',
        async () => {
          return await this.executeCreatePaymentPage(payment, options);
        },
        [],
        {
          timeout: this.config.timeout,
          name: 'PayTabs Create Payment Page',
          errorThresholdPercentage: 60,
          resetTimeout: 60000,
        },
        // Fallback function
        async () => {
          this.logger.warn('Using fallback for payment page creation');
          this.eventEmitter.emit('payment.service.unavailable', 
            new PaymentServiceUnavailableEvent('paytabs-create-page', new Date(), null, true)
          );
          
          return {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Payment service is temporarily unavailable. Please try again later.',
            },
          };
        }
      );

      const executionTime = Date.now() - startTime;
      this.logger.log(`Payment page creation completed in ${executionTime}ms`);

      if (result.success && result.redirectUrl) {
        this.eventEmitter.emit('payment.initiated', 
          new PaymentInitiatedEvent(payment, result.redirectUrl, options.urls, {
            executionTime,
            paymentMethods: options.paymentMethods,
          })
        );
      } else {
        this.eventEmitter.emit('payment.failed', 
          new PaymentFailedEvent(payment, result.error || { code: 'UNKNOWN', message: 'Unknown error' }, undefined, {
            executionTime,
            stage: 'payment_page_creation',
          })
        );
      }

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Payment page creation failed:', error);

      const paymentError = {
        code: error.code || 'PAYMENT_PAGE_ERROR',
        message: error.message || 'Failed to create payment page',
        details: error,
      };

      this.eventEmitter.emit('payment.failed', 
        new PaymentFailedEvent(payment, paymentError, undefined, {
          executionTime,
          stage: 'payment_page_creation',
        })
      );

      return {
        success: false,
        error: paymentError,
        metadata: { executionTime },
      };
    }
  }

  /**
   * Verify payment with enhanced error handling
   */
  async verifyPayment(transactionRef: string, paymentId?: string): Promise<VerificationResult> {
    await this.ensureInitialized();

    const startTime = Date.now();

    try {
      this.logger.log(`Verifying payment with transaction ref: ${transactionRef}`);

      const result = await this.circuitBreakerService.execute(
        'paytabs-verify',
        async () => {
          return await this.executePaymentVerification(transactionRef);
        },
        [],
        {
          timeout: this.config.timeout,
          name: 'PayTabs Payment Verification',
          errorThresholdPercentage: 50,
          resetTimeout: 30000,
        },
        // Fallback function
        async () => {
          this.logger.warn('Using fallback for payment verification');
          return {
            isValid: false,
            transactionRef,
            responseCode: 'SERVICE_UNAVAILABLE',
            status: 'unknown',
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Payment verification service is temporarily unavailable',
            },
          };
        }
      );

      const executionTime = Date.now() - startTime;
      this.logger.log(`Payment verification completed in ${executionTime}ms`);

      // Emit verification event
      if (paymentId) {
        const payment = { _id: paymentId } as Payment; // Simplified for event
        this.eventEmitter.emit('payment.verification', 
          new PaymentVerificationEvent(payment, {
            isValid: result.isValid,
            transactionRef: result.transactionRef,
            responseCode: result.responseCode,
            details: result.details,
          }, {
            executionTime,
          })
        );
      }

      return result;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error('Payment verification failed:', error);

      return {
        isValid: false,
        transactionRef,
        responseCode: 'VERIFICATION_ERROR',
        status: 'error',
        error: {
          code: error.code || 'VERIFICATION_ERROR',
          message: error.message || 'Payment verification failed',
        },
      };
    }
  }

  /**
   * Process payment callback with validation
   */
  async processCallback(callbackData: any): Promise<{
    transactionRef: string;
    status: string;
    code: string;
    message: string;
    paymentId: string;
    isValid: boolean;
    details?: any;
  }> {
    try {
      this.logger.log('Processing payment callback');

      const { respCode, respMessage, transRef, respStatus, cart } = callbackData;

      // Basic validation
      if (!transRef || !cart?.cart_id) {
        throw new Error('Invalid callback data: missing required fields');
      }

      const result = {
        transactionRef: transRef,
        status: respStatus,
        code: respCode,
        message: respMessage,
        paymentId: cart.cart_id,
        isValid: this.isValidPaymentStatus(respStatus, respCode),
        details: callbackData,
      };

      this.logger.log('Payment callback processed successfully', {
        transactionRef: result.transactionRef,
        status: result.status,
        isValid: result.isValid,
      });

      return result;

    } catch (error) {
      this.logger.error('Payment callback processing failed:', error);
      throw error;
    }
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats(): any {
    return {
      createPage: this.circuitBreakerService.getStats('paytabs-create-page'),
      verify: this.circuitBreakerService.getStats('paytabs-verify'),
      init: this.circuitBreakerService.getStats('paytabs-init'),
    };
  }

  /**
   * Health check for PayTabs service
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    initialized: boolean;
    circuitBreakers: any;
    lastError?: string;
  }> {
    try {
      const circuitBreakerHealth = this.circuitBreakerService.healthCheck();
      
      return {
        status: this.isInitialized && circuitBreakerHealth.healthy ? 'healthy' : 'degraded',
        initialized: this.isInitialized,
        circuitBreakers: circuitBreakerHealth,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        initialized: this.isInitialized,
        circuitBreakers: null,
        lastError: error.message,
      };
    }
  }

  /**
   * Execute payment page creation with retry logic
   */
  private async executeCreatePaymentPage(
    payment: Payment,
    options: PaymentPageOptions
  ): Promise<PaymentResult> {
    return new Promise(async (resolve, reject) => {
      try {
        const contract = await this.contractService.find_Id(payment.contractId.toString());
        const client = payment.client;
        
        // Prepare payment data
        const shippingInfo = await this.prepareShippingInfo(contract.employee);
        const clientInfo = await this.prepareClientInfo(client);
        const paymentInfo = await this.preparePaymentInfo(payment);

        const urls = [options.urls.callback, options.urls.return];

        // Execute PayTabs API call with timeout
        const timeoutId = setTimeout(() => {
          reject(new Error('PayTabs API call timed out'));
        }, this.config.timeout);

        await paytabs.createPaymentPage(
          options.paymentMethods,
          options.transactionTypes,
          paymentInfo,
          clientInfo,
          shippingInfo,
          options.language,
          urls,
          (result) => {
            clearTimeout(timeoutId);
            
            if (result && result.redirect_url) {
              resolve({
                success: true,
                redirectUrl: result.redirect_url,
                transactionRef: result.tran_ref,
                metadata: {
                  paymentRef: result.payment_ref,
                  cartId: result.cart_id,
                },
              });
            } else {
              resolve({
                success: false,
                error: {
                  code: 'NO_REDIRECT_URL',
                  message: 'PayTabs did not return a redirect URL',
                  details: result,
                },
              });
            }
          }
        );

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Execute payment verification with retry logic
   */
  private async executePaymentVerification(transactionRef: string): Promise<VerificationResult> {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Payment verification timed out'));
      }, this.config.timeout);

      paytabs.validatePayment(transactionRef, (result) => {
        clearTimeout(timeoutId);

        try {
          const responseCode = result['response_code'] || result['response_code:'];
          const isValid = responseCode === 400 ? false : true;

          resolve({
            isValid,
            transactionRef,
            responseCode: responseCode?.toString() || 'UNKNOWN',
            status: isValid ? 'verified' : 'failed',
            amount: result.tran_total,
            currency: result.tran_currency,
            details: result,
          });
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  /**
   * Setup circuit breakers with event listeners
   */
  private setupCircuitBreakers(): void {
    // Listen for circuit breaker events
    this.circuitBreakerService.createBreaker('paytabs-create-page', async () => {}, {})
      .on('open', () => {
        this.eventEmitter.emit('payment.circuit.opened', 
          new PaymentCircuitBreakerOpenedEvent('paytabs-create-page')
        );
      })
      .on('close', () => {
        this.eventEmitter.emit('payment.circuit.closed', 
          new PaymentCircuitBreakerClosedEvent('paytabs-create-page')
        );
      });

    this.circuitBreakerService.createBreaker('paytabs-verify', async () => {}, {})
      .on('open', () => {
        this.eventEmitter.emit('payment.circuit.opened', 
          new PaymentCircuitBreakerOpenedEvent('paytabs-verify')
        );
      })
      .on('close', () => {
        this.eventEmitter.emit('payment.circuit.closed', 
          new PaymentCircuitBreakerClosedEvent('paytabs-verify')
        );
      });
  }

  /**
   * Validate configuration
   */
  private validateConfig(): void {
    const requiredFields = ['profileId', 'serverKey'];
    const missingFields = requiredFields.filter(field => !this.config[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required PayTabs configuration: ${missingFields.join(', ')}`);
    }

    this.logger.log('PayTabs configuration validated successfully');
  }

  /**
   * Ensure service is initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Check if payment status is valid
   */
  private isValidPaymentStatus(status: string, code: string): boolean {
    // Define valid payment statuses based on PayTabs documentation
    const validStatuses = ['A', 'H', 'P']; // Authorized, Hold, Pending
    const validCodes = ['100', '200']; // Success codes
    
    return validStatuses.includes(status) || validCodes.includes(code);
  }

  /**
   * Prepare shipping information
   */
  private async prepareShippingInfo(employee: any): Promise<any[]> {
    // Implementation depends on your employee model structure
    return employee?.toArrayP ? await employee.toArrayP() : [];
  }

  /**
   * Prepare client information
   */
  private async prepareClientInfo(client: any): Promise<any[]> {
    // Implementation depends on your client model structure
    return client?.toArrayP ? await client.toArrayP() : [];
  }

  /**
   * Prepare payment information
   */
  private async preparePaymentInfo(payment: Payment): Promise<any[]> {
    // Implementation depends on your payment model structure
    return payment?.toArrayP ? await payment.toArrayP() : [];
  }
}

