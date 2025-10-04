/**
 * 🛡️ **ENHANCED PAYMENTS V3 CONTROLLER**
 * 
 * Advanced payment controller with comprehensive error handling, webhook security,
 * circuit breaker integration, and resilience patterns.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Param,
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
import { EnhancedPayTabsResilientService, PayTabsRequest, PayTabsVerificationRequest } from '../services/enhanced-paytabs-resilient.service';
import { WebhookSecurityService, WebhookValidationRequest } from '../services/webhook-security.service';
import { PayTabsErrorHandlerService } from '../services/paytabs-error-handler.service';
import { EventDrivenCircuitBreakerService } from '../../circuit-breaker/event-driven-circuit-breaker.service';
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

class CreatePaymentV3Dto {
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
  redirectUrl?: string;

  @IsOptional()
  @IsString()
  callbackUrl?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

class VerifyPaymentV3Dto {
  @IsString()
  transactionRef: string;

  @IsOptional()
  @IsString()
  paymentId?: string;
}

@ApiTags('Enhanced Payments V3')
@Controller('payments/v3')
export class EnhancedPaymentsV3Controller {
  private readonly logger = new Logger(EnhancedPaymentsV3Controller.name);

  constructor(
    private readonly enhancedPayTabsService: EnhancedPayTabsResilientService,
    private readonly webhookSecurityService: WebhookSecurityService,
    private readonly errorHandlerService: PayTabsErrorHandlerService,
    private readonly circuitBreakerService: EventDrivenCircuitBreakerService,
  ) {}

  /**
   * Create payment with enhanced error handling and resilience
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create payment with enhanced error handling',
    description: 'Creates a new payment with comprehensive error handling, circuit breaker protection, and resilience patterns',
  })
  @ApiBody({ type: CreatePaymentV3Dto })
  @ApiResponse({
    status: 201,
    description: 'Payment created successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        transactionRef: { type: 'string' },
        redirectUrl: { type: 'string' },
        message: { type: 'string' },
        respCode: { type: 'string' },
        fromFallback: { type: 'boolean' },
        executionTime: { type: 'number' },
        retryCount: { type: 'number' },
        circuitBreakerState: { type: 'string' },
        healthStatus: { type: 'object' },
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
    @Body() createPaymentDto: CreatePaymentV3Dto,
    @Req() req: Request,
  ) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Creating payment: ${createPaymentDto.amount} ${createPaymentDto.currency}`);

      // Extract user ID from JWT token
      const userId = (req as any).user?.id;

      // Create payment request
      const paymentRequest: PayTabsRequest = {
        amount: createPaymentDto.amount,
        currency: createPaymentDto.currency,
        description: createPaymentDto.description,
        clientInfo: createPaymentDto.clientInfo,
        redirectUrl: createPaymentDto.redirectUrl,
        callbackUrl: createPaymentDto.callbackUrl,
        metadata: {
          ...createPaymentDto.metadata,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          requestId: this.generateRequestId(),
        },
      };

      // Create payment with enhanced service
      const result = await this.enhancedPayTabsService.createPayment(paymentRequest, userId);

      // Get additional service information
      const circuitBreakerStats = this.enhancedPayTabsService.getCircuitBreakerStats();
      const healthStatus = this.enhancedPayTabsService.getHealthStatus();

      const response = {
        success: result.success,
        transactionRef: result.transactionRef,
        redirectUrl: result.redirectUrl,
        message: result.message,
        respCode: result.respCode,
        respMessage: result.respMessage,
        fromFallback: result.fromFallback || false,
        executionTime: result.executionTime || 0,
        retryCount: result.retryCount || 0,
        circuitBreakerState: circuitBreakerStats?.state || 'UNKNOWN',
        healthStatus: {
          isHealthy: healthStatus.isHealthy,
          responseTime: healthStatus.responseTime,
          uptime: healthStatus.uptime,
          errorRate: healthStatus.errorRate,
        },
        metadata: {
          totalExecutionTime: Date.now() - startTime,
          requestId: paymentRequest.metadata.requestId,
          serviceVersion: '3.0',
        },
      };

      this.logger.log(`Payment creation completed: ${result.success ? 'SUCCESS' : 'FAILED'}`);

      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`Payment creation failed: ${error.message}`, error.stack);

      // Handle error with error handler service
      const handledError = await this.errorHandlerService.handleError(error, {
        operation: 'create_payment',
        userId: (req as any).user?.id,
        correlationId: this.generateCorrelationId(),
        retryCount: 0,
        startTime: new Date(startTime),
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
          severity: handledError.severity,
          recoveryStrategy: handledError.recoveryStrategy,
        },
        handledError.httpStatus,
      );
    }
  }

  /**
   * Verify payment with enhanced error handling
   */
  @Post('verify')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify payment status',
    description: 'Verifies payment status with PayTabs gateway using enhanced error handling and resilience patterns',
  })
  @ApiBody({ type: VerifyPaymentV3Dto })
  @ApiResponse({
    status: 200,
    description: 'Payment verification completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        responseCode: { type: 'string' },
        amount: { type: 'number' },
        currency: { type: 'string' },
        message: { type: 'string' },
        transactionRef: { type: 'string' },
        status: { type: 'string' },
        fromFallback: { type: 'boolean' },
        executionTime: { type: 'number' },
      },
    },
  })
  async verifyPayment(
    @Body() verifyPaymentDto: VerifyPaymentV3Dto,
    @Req() req: Request,
  ) {
    const startTime = Date.now();

    try {
      this.logger.log(`Verifying payment: ${verifyPaymentDto.transactionRef}`);

      // Extract user ID from JWT token
      const userId = (req as any).user?.id;

      // Create verification request
      const verificationRequest: PayTabsVerificationRequest = {
        transactionRef: verifyPaymentDto.transactionRef,
        paymentId: verifyPaymentDto.paymentId,
      };

      // Verify payment with enhanced service
      const result = await this.enhancedPayTabsService.verifyPayment(verificationRequest, userId);

      const response = {
        success: result.success,
        responseCode: result.responseCode,
        amount: result.amount,
        currency: result.currency,
        message: result.message,
        transactionRef: result.transactionRef,
        status: result.status,
        fromFallback: result.fromFallback || false,
        executionTime: result.executionTime || 0,
        metadata: {
          totalExecutionTime: Date.now() - startTime,
          serviceVersion: '3.0',
        },
      };

      this.logger.log(`Payment verification completed: ${result.status}`);

      return response;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error(`Payment verification failed: ${error.message}`, error.stack);

      const handledError = await this.errorHandlerService.handleError(error, {
        operation: 'verify_payment',
        paymentId: verifyPaymentDto.paymentId,
        userId: (req as any).user?.id,
        correlationId: this.generateCorrelationId(),
        retryCount: 0,
        startTime: new Date(startTime),
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
   * Handle PayTabs webhook with enhanced security
   */
  @Post('webhook')
  @ApiOperation({
    summary: 'Handle PayTabs webhook with enhanced security',
    description: 'Processes PayTabs webhook with comprehensive security validation, signature verification, and replay protection',
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
      const userAgent = req.headers['user-agent'];

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

      // Create webhook validation request
      const validationRequest: WebhookValidationRequest = {
        payload: JSON.stringify(payload),
        signature,
        timestamp,
        ipAddress,
        headers,
        userAgent,
        contentType: req.headers['content-type'],
      };

      // Validate webhook security
      const securityValidation = await this.webhookSecurityService.validateWebhook(validationRequest);

      if (!securityValidation.isValid) {
        this.logger.warn(`Webhook security validation failed: ${webhookId} - ${securityValidation.reason}`);
        
        throw new HttpException(
          {
            success: false,
            error: 'WEBHOOK_SECURITY_VIOLATION',
            message: securityValidation.reason,
            webhookId,
            securityValidation: {
              signatureValid: securityValidation.signatureValid,
              timestampValid: securityValidation.timestampValid,
              ipWhitelisted: securityValidation.ipWhitelisted,
              replayDetected: securityValidation.replayDetected,
              rateLimitExceeded: securityValidation.rateLimitExceeded,
              securityScore: securityValidation.securityScore,
            },
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      // Process webhook payload if validation passed
      let verificationResult = null;
      if (payload.cart_id && payload.tran_ref) {
        try {
          verificationResult = await this.enhancedPayTabsService.verifyPayment({
            transactionRef: payload.tran_ref,
            paymentId: payload.cart_id,
          });
        } catch (error) {
          this.logger.warn(`Webhook payment verification failed: ${error.message}`);
        }
      }

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
          rateLimitExceeded: securityValidation.rateLimitExceeded,
          securityScore: securityValidation.securityScore,
          validationTime: securityValidation.validationDetails.validationTime,
        },
        paymentVerification: verificationResult ? {
          success: verificationResult.success,
          status: verificationResult.status,
          amount: verificationResult.amount,
          currency: verificationResult.currency,
        } : null,
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
          correlationId: this.generateCorrelationId(),
          retryCount: 0,
          startTime: new Date(startTime),
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
   * Get service health status
   */
  @Get('health')
  @ApiOperation({
    summary: 'Get service health status',
    description: 'Returns comprehensive health status including PayTabs service, circuit breaker, and error metrics',
  })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        payTabsHealth: { type: 'object' },
        circuitBreakerStats: { type: 'object' },
        errorMetrics: { type: 'object' },
        webhookSecurity: { type: 'object' },
        timestamp: { type: 'string' },
      },
    },
  })
  async getHealthStatus() {
    try {
      const payTabsHealth = this.enhancedPayTabsService.getHealthStatus();
      const circuitBreakerStats = this.enhancedPayTabsService.getCircuitBreakerStats();
      const errorMetrics = this.enhancedPayTabsService.getErrorMetrics();
      const webhookSecurityMetrics = this.webhookSecurityService.getSecurityMetrics();

      return {
        success: true,
        payTabsHealth: {
          isHealthy: payTabsHealth.isHealthy,
          responseTime: payTabsHealth.responseTime,
          lastCheck: payTabsHealth.lastCheck,
          consecutiveFailures: payTabsHealth.consecutiveFailures,
          uptime: payTabsHealth.uptime,
          errorRate: payTabsHealth.errorRate,
          circuitBreakerState: payTabsHealth.circuitBreakerState,
        },
        circuitBreakerStats: circuitBreakerStats ? {
          state: circuitBreakerStats.state,
          errorRate: circuitBreakerStats.metrics.errorRate,
          successRate: circuitBreakerStats.metrics.successRate,
          totalRequests: circuitBreakerStats.metrics.totalRequests,
          averageResponseTime: circuitBreakerStats.metrics.averageResponseTime,
          uptime: circuitBreakerStats.metrics.uptime,
          lastStateChange: circuitBreakerStats.lastStateChange,
        } : null,
        errorMetrics: {
          totalErrorTypes: errorMetrics.size,
          recentErrors: Array.from(errorMetrics.entries()).map(([type, metrics]) => ({
            errorType: type,
            totalCount: metrics.totalCount,
            lastOccurrence: metrics.lastOccurrence,
          })),
        },
        webhookSecurity: {
          totalRequests: webhookSecurityMetrics.totalRequests,
          validRequests: webhookSecurityMetrics.validRequests,
          invalidRequests: webhookSecurityMetrics.invalidRequests,
          securityScore: webhookSecurityMetrics.securityScore,
          lastValidRequest: webhookSecurityMetrics.lastValidRequest,
          lastSecurityViolation: webhookSecurityMetrics.lastSecurityViolation,
        },
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`Failed to get health status: ${error.message}`, error.stack);
      
      throw new HttpException(
        {
          success: false,
          error: 'HEALTH_CHECK_FAILED',
          message: 'Failed to retrieve service health status',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Get error metrics
   */
  @Get('metrics/errors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get error metrics',
    description: 'Returns detailed error metrics and statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Error metrics',
  })
  async getErrorMetrics() {
    try {
      const errorMetrics = this.errorHandlerService.getErrorMetrics();
      const errorHistory = this.errorHandlerService.getErrorHistory(50);

      const metrics: Record<string, any> = {};
      for (const [errorType, data] of errorMetrics.entries()) {
        metrics[errorType] = {
          totalCount: data.totalCount,
          lastOccurrence: data.lastOccurrence,
          averageResolutionTime: data.averageResolutionTime,
          retrySuccessRate: data.retrySuccessRate,
          severityDistribution: data.severityDistribution,
        };
      }

      return {
        success: true,
        errorMetrics: metrics,
        recentErrors: errorHistory.map(error => ({
          type: error.type,
          code: error.code,
          message: error.message,
          severity: error.severity,
          timestamp: error.timestamp,
          retryable: error.retryable,
        })),
        summary: {
          totalErrorTypes: errorMetrics.size,
          totalErrors: Array.from(errorMetrics.values()).reduce((sum, m) => sum + m.totalCount, 0),
          criticalErrors: errorHistory.filter(e => e.severity === 'CRITICAL').length,
          recentErrorRate: this.calculateRecentErrorRate(errorHistory),
        },
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`Failed to get error metrics: ${error.message}`, error.stack);
      
      throw new HttpException(
        {
          success: false,
          error: 'METRICS_RETRIEVAL_FAILED',
          message: 'Failed to retrieve error metrics',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Reset circuit breaker
   */
  @Post('circuit-breaker/reset')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reset circuit breaker',
    description: 'Manually reset the PayTabs circuit breaker to closed state',
  })
  @ApiResponse({
    status: 200,
    description: 'Circuit breaker reset successfully',
  })
  async resetCircuitBreaker() {
    try {
      this.enhancedPayTabsService.resetCircuitBreaker();
      
      this.logger.log('Circuit breaker reset manually');

      return {
        success: true,
        message: 'Circuit breaker reset successfully',
        timestamp: new Date().toISOString(),
      };

    } catch (error) {
      this.logger.error(`Failed to reset circuit breaker: ${error.message}`, error.stack);
      
      throw new HttpException(
        {
          success: false,
          error: 'CIRCUIT_BREAKER_RESET_FAILED',
          message: error.message,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Calculate recent error rate
   */
  private calculateRecentErrorRate(errorHistory: any[]): number {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentErrors = errorHistory.filter(error => new Date(error.timestamp) > fiveMinutesAgo);
    return recentErrors.length;
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

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
