import { Injectable, Logger, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { CreatePaymentDto, PaymentLinkToContractDto } from './dto/';
import { Payment } from './interface/payment.interface';
import { UsersService } from '../users/';
import { ContractService } from '../contracts/';
import { EnhancedPayTabsService } from './enhanced-paytabs.service';
import { WebhookSecurityService } from './webhook-security.service';
import { CacheService } from '../cache/cache.service';
import {
  PaymentCreatedEvent,
  PaymentInitiatedEvent,
  PaymentSuccessEvent,
  PaymentFailedEvent,
  PaymentStatusChangedEvent,
  PaymentWebhookReceivedEvent,
  PaymentVerificationEvent,
  PaymentTimeoutEvent,
} from './events/payment.events';

export interface PaymentProcessingOptions {
  paymentMethods?: string[];
  transactionTypes?: string[];
  language?: string;
  timeout?: number;
  retryAttempts?: number;
}

export interface PaymentStats {
  total: number;
  successful: number;
  failed: number;
  pending: number;
  successRate: number;
  averageAmount: number;
  totalAmount: number;
}

@Injectable()
export class EnhancedPaymentService {
  private readonly logger = new Logger(EnhancedPaymentService.name);

  constructor(
    @InjectModel('Payment') private readonly paymentModel: Model<Payment>,
    private userService: UsersService,
    private contractService: ContractService,
    private enhancedPayTabsService: EnhancedPayTabsService,
    private webhookSecurityService: WebhookSecurityService,
    private eventEmitter: EventEmitter2,
    private cacheService: CacheService
  ) {}

  /**
   * Create payment with enhanced error handling and events
   */
  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const startTime = Date.now();
    
    try {
      this.logger.log('Creating new payment', { contractId: createPaymentDto.contractId });

      const { contractId, ...paymentData } = createPaymentDto;

      // Validate contract exists
      const contract = await this.contractService.find_Id(contractId);
      if (!contract) {
        throw new BadRequestException(`Contract with ID ${contractId} not found`);
      }

      // Create payment
      const payment = new this.paymentModel({
        ...paymentData,
        _id: new Types.ObjectId(),
        status: 'created',
        createdAt: new Date(),
      });

      payment.client = contract.client;
      await payment.save();

      // Link to contract
      const linkData: PaymentLinkToContractDto = {
        paymentId: payment._id.toString(),
        contractId: contract._id.toString(),
      };

      const linkedPayment = await this.linkContract(linkData);

      // Emit payment created event
      this.eventEmitter.emit('payment.created', 
        new PaymentCreatedEvent(linkedPayment, contractId, {
          executionTime: Date.now() - startTime,
          amount: linkedPayment.amount,
          currency: linkedPayment.currency,
        })
      );

      // Invalidate related caches
      await this.invalidatePaymentCaches(linkedPayment.client.toString());

      this.logger.log('Payment created successfully', { 
        paymentId: linkedPayment._id,
        contractId,
        executionTime: Date.now() - startTime,
      });

      return linkedPayment;

    } catch (error) {
      this.logger.error('Payment creation failed:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException('Failed to create payment');
    }
  }

  /**
   * Process payment with circuit breaker and event handling
   */
  async processPayment(
    paymentId: string,
    urls: { callback: string; return: string },
    options: PaymentProcessingOptions = {}
  ): Promise<{ success: boolean; redirectUrl?: string; error?: any }> {
    const startTime = Date.now();

    try {
      this.logger.log('Processing payment', { paymentId });

      const payment = await this.findById(paymentId);
      if (!payment) {
        throw new BadRequestException(`Payment with ID ${paymentId} not found`);
      }

      if (payment.status !== 'created') {
        throw new BadRequestException(`Payment ${paymentId} is not in a processable state`);
      }

      // Update payment status to processing
      await this.updatePaymentStatus(payment, 'processing', 'Payment processing initiated');

      // Prepare payment options
      const paymentOptions = {
        paymentMethods: options.paymentMethods || ['all'],
        transactionTypes: options.transactionTypes || ['sale', 'ecom'],
        language: options.language || 'EN',
        urls,
      };

      // Process payment through PayTabs with circuit breaker
      const result = await this.enhancedPayTabsService.createPaymentPage(payment, paymentOptions);

      const executionTime = Date.now() - startTime;

      if (result.success && result.redirectUrl) {
        // Update payment with transaction reference
        if (result.transactionRef) {
          payment.transR = result.transactionRef;
          await payment.save();
        }

        this.logger.log('Payment processing successful', {
          paymentId,
          redirectUrl: result.redirectUrl,
          executionTime,
        });

        return {
          success: true,
          redirectUrl: result.redirectUrl,
        };
      } else {
        // Update payment status to failed
        await this.updatePaymentStatus(payment, 'failed', result.error?.message || 'Payment processing failed');

        this.logger.error('Payment processing failed', {
          paymentId,
          error: result.error,
          executionTime,
        });

        return {
          success: false,
          error: result.error,
        };
      }

    } catch (error) {
      this.logger.error('Payment processing error:', error);
      
      // Try to update payment status if we have the payment
      try {
        const payment = await this.findById(paymentId);
        if (payment) {
          await this.updatePaymentStatus(payment, 'failed', error.message);
        }
      } catch (updateError) {
        this.logger.error('Failed to update payment status after error:', updateError);
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Payment processing failed');
    }
  }

  /**
   * Handle secure webhook with signature verification
   */
  async handleWebhook(
    payload: string | Buffer,
    headers: Record<string, string>,
    clientIP?: string
  ): Promise<{ success: boolean; message: string; data?: any }> {
    const startTime = Date.now();

    try {
      this.logger.log('Processing webhook', { 
        payloadSize: payload.length,
        clientIP,
        headers: Object.keys(headers),
      });

      // Validate webhook security
      const validationResult = this.webhookSecurityService.validateWebhook(payload, headers, clientIP);
      
      if (!validationResult.isValid) {
        this.logger.warn('Webhook validation failed', {
          reason: validationResult.reason,
          clientIP,
        });

        return {
          success: false,
          message: `Webhook validation failed: ${validationResult.reason}`,
        };
      }

      // Process callback data
      const callbackResult = await this.enhancedPayTabsService.processCallback(validationResult.payload);
      
      // Find payment
      const payment = await this.findById(callbackResult.paymentId);
      if (!payment) {
        this.logger.warn('Payment not found for webhook', { paymentId: callbackResult.paymentId });
        return {
          success: false,
          message: 'Payment not found',
        };
      }

      // Emit webhook received event
      this.eventEmitter.emit('payment.webhook.received',
        new PaymentWebhookReceivedEvent(
          payment,
          validationResult.payload,
          validationResult.isValid,
          validationResult,
          { executionTime: Date.now() - startTime }
        )
      );

      // Verify payment
      const verificationResult = await this.verifyPayment(callbackResult.transactionRef, payment._id.toString());

      const executionTime = Date.now() - startTime;

      if (verificationResult.isValid) {
        this.logger.log('Webhook processed successfully', {
          paymentId: payment._id,
          transactionRef: callbackResult.transactionRef,
          executionTime,
        });

        return {
          success: true,
          message: 'Webhook processed successfully',
          data: {
            paymentId: payment._id,
            transactionRef: callbackResult.transactionRef,
            status: payment.status,
          },
        };
      } else {
        this.logger.warn('Payment verification failed in webhook', {
          paymentId: payment._id,
          transactionRef: callbackResult.transactionRef,
          error: verificationResult.error,
        });

        return {
          success: false,
          message: 'Payment verification failed',
          data: verificationResult.error,
        };
      }

    } catch (error) {
      this.logger.error('Webhook processing error:', error);
      return {
        success: false,
        message: 'Webhook processing failed',
      };
    }
  }

  /**
   * Verify payment with enhanced error handling
   */
  async verifyPayment(transactionRef: string, paymentId: string): Promise<{
    success: boolean;
    message: string;
    payment?: Payment;
    error?: any;
  }> {
    const startTime = Date.now();

    try {
      this.logger.log('Verifying payment', { transactionRef, paymentId });

      const verificationResult = await this.enhancedPayTabsService.verifyPayment(transactionRef, paymentId);

      const payment = await this.findById(paymentId);
      if (!payment) {
        throw new BadRequestException(`Payment with ID ${paymentId} not found`);
      }

      if (verificationResult.isValid) {
        // Update payment status to paid
        const previousStatus = payment.status;
        payment.status = 'paid';
        payment.transR = transactionRef;
        payment.verifiedAt = new Date();
        await payment.save();

        // Emit success event
        this.eventEmitter.emit('payment.success',
          new PaymentSuccessEvent(
            payment,
            transactionRef,
            payment.amount,
            payment.currency,
            { 
              executionTime: Date.now() - startTime,
              verificationDetails: verificationResult.details,
            }
          )
        );

        // Emit status change event
        this.eventEmitter.emit('payment.status.changed',
          new PaymentStatusChangedEvent(
            payment,
            previousStatus,
            'paid',
            'Payment verified successfully'
          )
        );

        // Invalidate caches
        await this.invalidatePaymentCaches(payment.client.toString());

        this.logger.log('Payment verification successful', {
          paymentId,
          transactionRef,
          executionTime: Date.now() - startTime,
        });

        return {
          success: true,
          message: 'Payment verified successfully',
          payment,
        };
      } else {
        // Update payment status to failed
        await this.updatePaymentStatus(
          payment, 
          'failed', 
          verificationResult.error?.message || 'Payment verification failed'
        );

        this.logger.warn('Payment verification failed', {
          paymentId,
          transactionRef,
          error: verificationResult.error,
        });

        return {
          success: false,
          message: 'Payment verification failed',
          error: verificationResult.error,
        };
      }

    } catch (error) {
      this.logger.error('Payment verification error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException('Payment verification failed');
    }
  }

  /**
   * Get payment statistics with caching
   */
  async getPaymentStats(
    filters: {
      clientId?: string;
      contractId?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<PaymentStats> {
    try {
      const cacheKey = `payment-stats:${JSON.stringify(filters)}`;
      
      // Try to get from cache
      const cached = await this.cacheService.getAggregation({
        collection: 'payments',
        pipeline: JSON.stringify(['stats', filters]),
      });

      if (cached) {
        return cached[0];
      }

      // Build aggregation pipeline
      const matchConditions: any = {};
      
      if (filters.clientId) {
        matchConditions.client = new Types.ObjectId(filters.clientId);
      }
      
      if (filters.contractId) {
        matchConditions.contractId = new Types.ObjectId(filters.contractId);
      }
      
      if (filters.dateFrom || filters.dateTo) {
        matchConditions.createdAt = {};
        if (filters.dateFrom) matchConditions.createdAt.$gte = filters.dateFrom;
        if (filters.dateTo) matchConditions.createdAt.$lte = filters.dateTo;
      }

      const pipeline = [
        ...(Object.keys(matchConditions).length > 0 ? [{ $match: matchConditions }] : []),
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            successful: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $in: ['$status', ['created', 'processing']] }, 1, 0] }
            },
            totalAmount: { $sum: '$amount' },
            amounts: { $push: '$amount' },
          }
        },
        {
          $addFields: {
            successRate: {
              $cond: [
                { $gt: ['$total', 0] },
                { $multiply: [{ $divide: ['$successful', '$total'] }, 100] },
                0
              ]
            },
            averageAmount: {
              $cond: [
                { $gt: ['$total', 0] },
                { $avg: '$amounts' },
                0
              ]
            }
          }
        }
      ];

      const result = await this.paymentModel.aggregate(pipeline).exec();
      const stats = result[0] || {
        total: 0,
        successful: 0,
        failed: 0,
        pending: 0,
        successRate: 0,
        averageAmount: 0,
        totalAmount: 0,
      };

      // Cache the result
      await this.cacheService.setAggregation(
        {
          collection: 'payments',
          pipeline: JSON.stringify(['stats', filters]),
        },
        [stats],
        { ttl: 300 } // 5 minutes
      );

      return stats;

    } catch (error) {
      this.logger.error('Error getting payment statistics:', error);
      throw new InternalServerErrorException('Failed to get payment statistics');
    }
  }

  /**
   * Find payment by ID with caching
   */
  async findById(id: string): Promise<Payment | null> {
    try {
      // Try cache first
      const cached = await this.cacheService.getAggregation({
        collection: 'payments',
        pipeline: JSON.stringify([{ $match: { _id: new Types.ObjectId(id) } }]),
      });

      if (cached && cached.length > 0) {
        return cached[0];
      }

      // Fallback to database
      const payment = await this.paymentModel.findById(id).exec();

      // Cache the result
      if (payment) {
        await this.cacheService.setAggregation(
          {
            collection: 'payments',
            pipeline: JSON.stringify([{ $match: { _id: new Types.ObjectId(id) } }]),
          },
          [payment],
          { ttl: 1800 } // 30 minutes
        );
      }

      return payment;

    } catch (error) {
      this.logger.error(`Error finding payment ${id}:`, error);
      return null;
    }
  }

  /**
   * Get payments for user with pagination
   */
  async getPaymentsForUser(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    payments: Payment[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        this.paymentModel
          .find({ client: new Types.ObjectId(userId) })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.paymentModel.countDocuments({ client: new Types.ObjectId(userId) }),
      ]);

      return {
        payments,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };

    } catch (error) {
      this.logger.error(`Error getting payments for user ${userId}:`, error);
      throw new InternalServerErrorException('Failed to get user payments');
    }
  }

  /**
   * Link payment to contract
   */
  private async linkContract(linkData: PaymentLinkToContractDto): Promise<Payment> {
    const { paymentId, contractId } = linkData;
    
    const payment = await this.paymentModel.findById(paymentId);
    const contract = await this.contractService.find_Id(contractId);
    
    if (!payment || !contract) {
      throw new BadRequestException('Payment or contract not found');
    }

    payment.contractId = contract._id;
    return await payment.save();
  }

  /**
   * Update payment status with event emission
   */
  private async updatePaymentStatus(payment: Payment, newStatus: string, reason?: string): Promise<void> {
    const previousStatus = payment.status;
    payment.status = newStatus;
    payment.updatedAt = new Date();
    
    if (reason) {
      payment.statusReason = reason;
    }

    await payment.save();

    // Emit status change event
    this.eventEmitter.emit('payment.status.changed',
      new PaymentStatusChangedEvent(payment, previousStatus, newStatus, reason)
    );
  }

  /**
   * Invalidate payment-related caches
   */
  private async invalidatePaymentCaches(clientId: string): Promise<void> {
    try {
      await Promise.all([
        this.cacheService.invalidateCollection('payments'),
        this.cacheService.invalidatePattern(`*client:${clientId}*`),
        this.cacheService.invalidatePattern('payment-stats:*'),
      ]);
    } catch (error) {
      this.logger.error('Error invalidating payment caches:', error);
    }
  }

  // Event listeners
  @OnEvent('payment.timeout')
  async handlePaymentTimeout(event: PaymentTimeoutEvent): Promise<void> {
    this.logger.warn('Payment timeout detected', {
      paymentId: event.payment._id,
      timeout: event.timeoutDuration,
    });

    try {
      await this.updatePaymentStatus(
        event.payment,
        'timeout',
        `Payment timed out after ${event.timeoutDuration}ms`
      );
    } catch (error) {
      this.logger.error('Error handling payment timeout:', error);
    }
  }

  @OnEvent('payment.circuit.opened')
  async handleCircuitBreakerOpened(event: any): Promise<void> {
    this.logger.warn('Payment service circuit breaker opened', {
      serviceName: event.serviceName,
      timestamp: event.timestamp,
    });

    // Could implement additional logic like notifications, fallback mechanisms, etc.
  }
}

