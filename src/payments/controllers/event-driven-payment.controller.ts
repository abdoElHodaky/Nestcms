/**
 * 🎯 **EVENT-DRIVEN PAYMENT CONTROLLER**
 * 
 * Advanced payment controller with event-driven architecture, circuit breaker
 * integration, comprehensive monitoring, and resilience patterns.
 * 
 * @author NestCMS Team
 * @version 2.0.0
 * @since 2024-01-15
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  Headers,
  Req,
  Res,
  HttpStatus,
  HttpException,
  UseGuards,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { EventDrivenPaymentService, PaymentRequest } from '../services/event-driven-payment.service';
import { EventDrivenCircuitBreakerService } from '../../circuit-breaker/event-driven-circuit-breaker.service';
import { WebhookSecurityService } from '../services/webhook-security.service';
import { PayTabsErrorHandlerService } from '../services/paytabs-error-handler.service';
import { IsString, IsNumber, IsOptional, IsObject, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

// DTOs for request validation
class ClientInfoDto {
  @IsString()
  name: string;

  @IsString()
  email: string;

  @IsString()
  phone: string;

  @IsObject()
  address: any;
}

class CreatePaymentDto {
  @IsString()
  contractId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  description: string;

  @ValidateNested()
  @Type(() => ClientInfoDto)
  clientInfo: ClientInfoDto;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  redirectUrl?: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

class VerifyPaymentDto {
  @IsString()
  transactionRef: string;
}

@ApiTags('Event-Driven Payments')
@Controller('payments/v4')
export class EventDrivenPaymentController {
  private readonly logger = new Logger(EventDrivenPaymentController.name);

  constructor(
    private readonly eventDrivenPaymentService: EventDrivenPaymentService,
    private readonly circuitBreakerService: EventDrivenCircuitBreakerService,
    private readonly webhookSecurityService: WebhookSecurityService,
    private readonly errorHandlerService: PayTabsErrorHandlerService,
  ) {}

  /**
   * Create payment with event-driven architecture and circuit breaker protection
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create payment with event-driven architecture',
    description: 'Creates a new payment with comprehensive event tracking, circuit breaker protection, and resilience patterns',
  })
  @ApiBody({ type: CreatePaymentDto })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        paymentId: { type: 'string' },
        transactionRef: { type: 'string' },
        redirectUrl: { type: 'string' },
        status: { type: 'string' },
        message: { type: 'string' },
        events: { type: 'array', items: { type: 'object' } },
        fromFallback: { type: 'boolean' },
        executionTime: { type: 'number' },
        circuitBreakerStats: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request data',
  })
  @ApiResponse({
    status: 503,
    description: 'Service temporarily unavailable',
  })
  async createPayment(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: Request,
  ) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Creating payment for contract: ${createPaymentDto.contractId}`);

      // Extract user ID from JWT token
      const userId = (req as any).user?.id;

      // Create payment request
      const paymentRequest: PaymentRequest = {
        contractId: createPaymentDto.contractId,
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        description: createPaymentDto.description,
        clientInfo: createPaymentDto.clientInfo,
        paymentMethod: createPaymentDto.paymentMethod,
        redirectUrl: createPaymentDto.redirectUrl,
        callbackUrl: createPaymentDto.callbackUrl,
        metadata: {
          ...createPaymentDto.metadata,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          requestId: this.generateRequestId(),
        },
      };

      // Create payment with event-driven service
      const result = await this.eventDrivenPaymentService.createPayment(paymentRequest, userId);

      // Get circuit breaker statistics
      const circuitBreakerStats = {
        paytabsApi: this.circuitBreakerService.getStats('paytabs-api'),
        database: this.circuitBreakerService.getStats('payment-database'),
      };

      const response = {
        success: result.status !== 'failed',
        paymentId: result.paymentId,
        transactionRef: result.transactionRef,
        redirectUrl: result.redirectUrl,
        status: result.status,
        message: result.message,
        events: result.events.map(event => ({
          id: event.id,
          type: event.type,
          timestamp: event.timestamp,
          priority: event.priority,
        })),
        fromFallback: result.fromFallback,
        executionTime: result.executionTime,
        circuitBreakerStats,
        metadata: {
          totalExecutionTime: Date.now() - startTime,
          eventsEmitted: result.events.length,
          requestId: paymentRequest.metadata.requestId,
        },
      };

      this.logger.log(`Payment creation completed: ${result.paymentId} (${result.status})`);

      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`Payment creation failed: ${error.message}`, error.stack);

      // Handle error with error handler service
      const handledError = await this.errorHandlerService.handleError(error, {
        operation: 'create_payment',
        contractId: createPaymentDto.contractId,
        amount: createPaymentDto.amount,
        executionTime,
      });

      throw new HttpException(
        {
          success: false,
          error: handledError.errorCode,
          message: handledError.userMessage,
          details: handledError.details,
          executionTime,
          retryable: handledError.retryable,
          retryAfter: handledError.retryAfter,
        },
        handledError.httpStatus,
      );
    }
  }

  /**
   * Verify payment with event-driven architecture
   */
  @Post('verify/:paymentId')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify payment status',
    description: 'Verifies payment status with PayTabs gateway and updates local records with event tracking',
  })
  @ApiParam({ name: 'paymentId', description: 'Payment ID to verify' })
  @ApiBody({ type: VerifyPaymentDto })
  @ApiResponse({
    status: 200,
    description: 'Payment verification completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        valid: { type: 'boolean' },
        paymentId: { type: 'string' },
        transactionRef: { type: 'string' },
        status: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        message: { type: 'string' },
        events: { type: 'array', items: { type: 'object' } },
        executionTime: { type: 'number' },
      },
    },
  })
  async verifyPayment(
    @Param('paymentId') paymentId: string,
    @Body() verifyPaymentDto: VerifyPaymentDto,
  ) {
    const startTime = Date.now();

    try {
      this.logger.log(`Verifying payment: ${paymentId} with transaction: ${verifyPaymentDto.transactionRef}`);

      const result = await this.eventDrivenPaymentService.verifyPayment(
        paymentId,
        verifyPaymentDto.transactionRef,
      );

      const response = {
        success: true,
        valid: result.valid,
        paymentId,
        transactionRef: result.transactionRef,
        status: result.status,
        amount: result.amount,
        currency: result.currency,
        message: result.message,
        events: result.events.map(event => ({
          id: event.id,
          type: event.type,
          timestamp: event.timestamp,
          priority: event.priority,
        })),
        executionTime: Date.now() - startTime,
      };

      this.logger.log(`Payment verification completed: ${paymentId} (${result.status})`);

      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`Payment verification failed: ${error.message}`, error.stack);

      const handledError = await this.errorHandlerService.handleError(error, {
        operation: 'verify_payment',
        paymentId,
        transactionRef: verifyPaymentDto.transactionRef,
        executionTime,
      });

      throw new HttpException(
        {
          success: false,
          error: handledError.errorCode,
          message: handledError.userMessage,
          details: handledError.details,
          executionTime,
        },
        handledError.httpStatus,
      );
    }
  }

  /**
   * Handle PayTabs webhook with enhanced security and event processing
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Handle PayTabs webhook',
    description: 'Processes PayTabs webhook with signature verification, replay protection, and event-driven processing',
  })
  @ApiResponse({
    status: 200,
    description: 'Webhook processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        webhookId: { type: 'string' },
        paymentId: { type: 'string' },
        transactionRef: { type: 'string' },
        status: { type: 'string' },
        processingTime: { type: 'number' },
        securityValidation: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid webhook signature or payload',
  })
  @ApiResponse({
    status: 429,
    description: 'Rate limit exceeded',
  })
  async handleWebhook(
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const startTime = Date.now();
    const webhookId = this.generateWebhookId();

    try {
      this.logger.log(`Processing webhook: ${webhookId}`);

      // Extract security headers
      const signature = headers['x-paytabs-signature'] || headers['signature'];
      const timestamp = headers['x-paytabs-timestamp'] || headers['timestamp'];
      const ipAddress = req.ip;

      if (!signature || !timestamp) {
        throw new HttpException(
          {
            success: false,
            error: 'MISSING_SECURITY_HEADERS',
            message: 'Required security headers are missing',
            webhookId,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Validate webhook security
      const securityValidation = await this.webhookSecurityService.validateWebhook({
        payload: JSON.stringify(payload),
        signature,
        timestamp,
        ipAddress,
        headers,
      });

      if (!securityValidation.isValid) {
        this.logger.warn(`Webhook security validation failed: ${webhookId} - ${securityValidation.reason}`);
        
        throw new HttpException(
          {
            success: false,
            error: 'WEBHOOK_SECURITY_VIOLATION',
            message: securityValidation.reason,
            webhookId,
            securityValidation,
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Process webhook with event-driven service
      await this.eventDrivenPaymentService.handleWebhook(payload, signature, timestamp, ipAddress);

      const processingTime = Date.now() - startTime;

      const response = {
        success: true,
        message: 'Webhook processed successfully',
        webhookId,
        paymentId: payload.cart_id,
        transactionRef: payload.tran_ref,
        status: payload.respStatus === 'A' ? 'completed' : 'failed',
        processingTime,
        securityValidation: {
          signatureValid: securityValidation.signatureValid,
          timestampValid: securityValidation.timestampValid,
          ipWhitelisted: securityValidation.ipWhitelisted,
          replayDetected: securityValidation.replayDetected,
        },
      };

      this.logger.log(`Webhook processed successfully: ${webhookId} (${processingTime}ms)`);

      res.status(HttpStatus.OK).json(response);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Webhook processing failed: ${webhookId} - ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        res.status(error.getStatus()).json(error.getResponse());
      } else {
        const handledError = await this.errorHandlerService.handleError(error, {
          operation: 'webhook_processing',
          webhookId,
          paymentId: payload?.cart_id,
          processingTime,
        });

        res.status(handledError.httpStatus).json({
          success: false,
          error: handledError.errorCode,
          message: handledError.userMessage,
          webhookId,
          processingTime,
        });
      }
    }
  }

  /**
   * Get circuit breaker health status
   */
  @Get('health/circuit-breakers')
  @ApiOperation({
    summary: 'Get circuit breaker health status',
    description: 'Returns the current status and metrics of all circuit breakers',
  })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker health status',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        circuitBreakers: { type: 'object' },
        summary: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  })
  async getCircuitBreakerHealth() {
    try {
      const allStats = this.circuitBreakerService.getAllStats();
      const circuitBreakers: Record<string, any> = {};
      
      let totalCircuits = 0;
      let openCircuits = 0;
      let halfOpenCircuits = 0;
      let closedCircuits = 0;

      for (const [serviceName, stats] of allStats.entries()) {
        circuitBreakers[serviceName] = {
          state: stats.state,
          errorRate: stats.metrics.errorRate,
          successRate: stats.metrics.successRate,
          totalRequests: stats.metrics.totalRequests,
          failedRequests: stats.metrics.failedRequests,
          averageResponseTime: stats.metrics.averageResponseTime,
          uptime: stats.metrics.uptime,
          lastStateChange: stats.lastStateChange,
          nextRetryTime: stats.nextRetryTime,
          activeRequests: stats.activeRequests,
        };

        totalCircuits++;
        switch (stats.state) {
          case 'OPEN':
            openCircuits++;
            break;
          case 'HALF_OPEN':
            halfOpenCircuits++;
            break;
          case 'CLOSED':
            closedCircuits++;
            break;
        }
      }

      const summary = {
        totalCircuits,
        openCircuits,
        halfOpenCircuits,
        closedCircuits,
        healthScore: totalCircuits > 0 ? ((closedCircuits + halfOpenCircuits * 0.5) / totalCircuits) * 100 : 100,
      };

      return {
        success: true,
        circuitBreakers,
        summary,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`Failed to get circuit breaker health: ${error.message}`, error.stack);
      
      throw new HttpException(
        {
          success: false,
          error: 'HEALTH_CHECK_FAILED',
          message: 'Failed to retrieve circuit breaker health status',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get payment service metrics
   */
  @Get('metrics')
  @ApiOperation({
    summary: 'Get payment service metrics',
    description: 'Returns comprehensive metrics for the event-driven payment service',
  })
  @ApiResponse({
    status: 200,
    description: 'Payment service metrics',
  })
  async getMetrics() {
    try {
      const circuitBreakerStats = this.circuitBreakerService.getAllStats();
      const metrics: Record<string, any> = {};

      for (const [serviceName, stats] of circuitBreakerStats.entries()) {
        metrics[serviceName] = {
          performance: {
            totalRequests: stats.metrics.totalRequests,
            successfulRequests: stats.metrics.successfulRequests,
            failedRequests: stats.metrics.failedRequests,
            successRate: stats.metrics.successRate,
            errorRate: stats.metrics.errorRate,
            averageResponseTime: stats.metrics.averageResponseTime,
            p95ResponseTime: stats.metrics.p95ResponseTime,
            p99ResponseTime: stats.metrics.p99ResponseTime,
            throughput: stats.metrics.throughput,
            uptime: stats.metrics.uptime,
          },
          circuitBreaker: {
            state: stats.state,
            consecutiveFailures: stats.metrics.consecutiveFailures,
            consecutiveSuccesses: stats.metrics.consecutiveSuccesses,
            lastStateChange: stats.lastStateChange,
            stateHistory: stats.stateHistory.slice(-10), // Last 10 state changes
          },
          configuration: stats.config,
        };
      }

      return {
        success: true,
        metrics,
        timestamp: new Date().toISOString(),
        summary: {
          totalServices: circuitBreakerStats.size,
          healthyServices: Array.from(circuitBreakerStats.values()).filter(s => s.state === 'CLOSED').length,
          degradedServices: Array.from(circuitBreakerStats.values()).filter(s => s.state === 'HALF_OPEN').length,
          unhealthyServices: Array.from(circuitBreakerStats.values()).filter(s => s.state === 'OPEN').length,
        },
      };

    } catch (error) {
      this.logger.error(`Failed to get metrics: ${error.message}`, error.stack);
      
      throw new HttpException(
        {
          success: false,
          error: 'METRICS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve service metrics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Reset circuit breaker
   */
  @Post('circuit-breakers/:serviceName/reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reset circuit breaker',
    description: 'Manually reset a circuit breaker to closed state',
  })
  @ApiParam({ name: 'serviceName', description: 'Name of the service circuit breaker to reset' })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker reset successfully',
  })
  async resetCircuitBreaker(@Param('serviceName') serviceName: string) {
    try {
      this.circuitBreakerService.reset(serviceName);
      
      this.logger.log(`Circuit breaker reset for service: ${serviceName}`);

      return {
        success: true,
        message: `Circuit breaker reset for service: ${serviceName}`,
        serviceName,
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`Failed to reset circuit breaker for ${serviceName}: ${error.message}`, error.stack);
      
      throw new HttpException(
        {
          success: false,
          error: 'CIRCUIT_BREAKER_RESET_FAILED',
          message: error.message,
          serviceName,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique webhook ID
   */
  private generateWebhookId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
