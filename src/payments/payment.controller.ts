/**
 * 🎯 **UNIFIED PAYMENT CONTROLLER**
 * 
 * Consolidated payment controller that combines functionality from all existing
 * payment controllers into a single, versioned API. Supports v1, v2, and v3
 * endpoints while maintaining backward compatibility.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  Ip,
  UseGuards,
  HttpStatus,
  HttpException,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiHeader,
  ApiBearerAuth,
  ApiSecurity,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

// DTOs and Interfaces
import {
  CreatePaymentDto,
  EnhancedPaymentDto,
  PaymentVerificationDto,
  PaymentCallbackDto,
  BasePaymentResponseDto,
  PaymentRedirectResponseDto,
  PaymentVerificationResponseDto,
} from './dto';
import { Payment } from './interface/payment.interface';

// Services
import { PaymentService } from './services/core/payment.service';
import { WebhookSecurityService } from './services/webhook-security.service';
import { PaymentErrorHandlerService } from './services/error/payment-error-handler.service';

// Legacy Services (for backward compatibility)
import { PaymentService as LegacyPaymentService } from './payments.service';

export interface PaymentControllerOptions {
  enableSecurity?: boolean;
  enableMetrics?: boolean;
  enableEvents?: boolean;
  correlationId?: string;
}

@ApiTags('Payments')
@Controller('payments')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);

  constructor(
    private readonly paymentService: PaymentService,
    private readonly webhookSecurity: WebhookSecurityService,
    private readonly errorHandler: PaymentErrorHandlerService,
    private readonly legacyPaymentService: LegacyPaymentService, // For backward compatibility
  ) {}

  // ============================================================================
  // V3 ENDPOINTS (Latest - Enhanced with all features)
  // ============================================================================

  @Post('v3/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create enhanced payment (v3)',
    description: 'Create a new payment with advanced features including resilience patterns, error handling, and event emission.'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Payment created successfully',
    type: BasePaymentResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createEnhancedPayment(
    @Body() enhancedPaymentDto: EnhancedPaymentDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<BasePaymentResponseDto> {
    try {
      this.logger.log(`Creating enhanced payment v3 with correlation ID: ${correlationId}`);

      const result = await this.paymentService.createPayment(enhancedPaymentDto, {
        enableRetry: enhancedPaymentDto.enableRetry,
        enableCircuitBreaker: enhancedPaymentDto.enableCircuitBreaker,
        enableFallback: enhancedPaymentDto.enableFallback,
        enableEvents: enhancedPaymentDto.enableEvents,
        enableCaching: enhancedPaymentDto.enableCaching,
        priority: enhancedPaymentDto.priority,
        timeout: enhancedPaymentDto.timeout,
        correlationId,
      });

      if (!result.success) {
        throw new HttpException(
          result.error?.message || 'Payment creation failed',
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        paymentId: result.data._id.toString(),
        respMessage: 'Payment created successfully',
        timestamp: new Date(),
        executionTime: result.executionTime,
        correlationId: result.correlationId,
      };

    } catch (error) {
      const payTabsError = await this.errorHandler.handleError(error, {
        operation: 'create_enhanced_payment_v3',
        correlationId,
      });

      throw new HttpException(
        payTabsError.userMessage,
        payTabsError.httpStatus
      );
    }
  }

  @Post('v3/process/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Process payment (v3)',
    description: 'Process payment with PayTabs integration and advanced error handling.'
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment processed successfully',
    type: PaymentRedirectResponseDto 
  })
  async processEnhancedPayment(
    @Param('id') paymentId: string,
    @Body() urls: { callback: string; return: string },
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<PaymentRedirectResponseDto> {
    try {
      this.logger.log(`Processing enhanced payment v3: ${paymentId}`);

      const result = await this.paymentService.processPayment(paymentId, urls, {
        enableRetry: true,
        enableCircuitBreaker: true,
        enableFallback: true,
        enableEvents: true,
        correlationId,
      });

      if (!result.success) {
        throw new HttpException(
          result.error?.message || 'Payment processing failed',
          HttpStatus.BAD_REQUEST
        );
      }

      return result.data;

    } catch (error) {
      const payTabsError = await this.errorHandler.handleError(error, {
        operation: 'process_enhanced_payment_v3',
        paymentId,
        correlationId,
      });

      throw new HttpException(
        payTabsError.userMessage,
        payTabsError.httpStatus
      );
    }
  }

  @Post('v3/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Verify payment (v3)',
    description: 'Verify payment status with comprehensive validation.'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Payment verification completed',
    type: PaymentVerificationResponseDto 
  })
  async verifyEnhancedPayment(
    @Body() verificationDto: PaymentVerificationDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<PaymentVerificationResponseDto> {
    try {
      this.logger.log(`Verifying enhanced payment v3: ${verificationDto.transactionRef}`);

      const result = await this.paymentService.verifyPayment(verificationDto, {
        enableRetry: true,
        enableCircuitBreaker: true,
        correlationId,
      });

      if (!result.success) {
        throw new HttpException(
          result.error?.message || 'Payment verification failed',
          HttpStatus.BAD_REQUEST
        );
      }

      return result.data;

    } catch (error) {
      const payTabsError = await this.errorHandler.handleError(error, {
        operation: 'verify_enhanced_payment_v3',
        transactionRef: verificationDto.transactionRef,
        correlationId,
      });

      throw new HttpException(
        payTabsError.userMessage,
        payTabsError.httpStatus
      );
    }
  }

  @Post('v3/webhook')
  @ApiOperation({ 
    summary: 'Handle payment webhook (v3)',
    description: 'Handle payment webhooks with security validation and comprehensive processing.'
  })
  @ApiHeader({ name: 'x-paytabs-signature', description: 'Webhook signature' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  @ApiResponse({ status: 401, description: 'Invalid webhook signature' })
  async handleEnhancedWebhook(
    @Body() callbackData: PaymentCallbackDto,
    @Headers('x-paytabs-signature') signature?: string,
    @Headers('x-timestamp') timestamp?: string,
    @Ip() ipAddress?: string,
    @Headers() headers?: Record<string, string>,
  ): Promise<BasePaymentResponseDto> {
    try {
      this.logger.log('Handling enhanced webhook v3');

      // Validate webhook security
      if (signature) {
        const validationResult = await this.webhookSecurity.validateWebhook({
          payload: JSON.stringify(callbackData),
          signature,
          timestamp: timestamp || Date.now().toString(),
          ipAddress: ipAddress || '0.0.0.0',
          headers: headers || {},
        });

        if (!validationResult.isValid) {
          throw new HttpException(
            `Webhook validation failed: ${validationResult.reason}`,
            HttpStatus.UNAUTHORIZED
          );
        }
      }

      // Add signature to callback data
      const enrichedCallbackData = {
        ...callbackData,
        signature,
        timestamp: timestamp ? parseInt(timestamp) : Date.now(),
      };

      const result = await this.paymentService.handleCallback(enrichedCallbackData, {
        enableEvents: true,
        correlationId: this.generateCorrelationId(),
      });

      if (!result.success) {
        throw new HttpException(
          result.error?.message || 'Webhook processing failed',
          HttpStatus.BAD_REQUEST
        );
      }

      return result.data;

    } catch (error) {
      const payTabsError = await this.errorHandler.handleError(error, {
        operation: 'handle_enhanced_webhook_v3',
      });

      throw new HttpException(
        payTabsError.userMessage,
        payTabsError.httpStatus
      );
    }
  }

  @Get('v3/health')
  @ApiOperation({ 
    summary: 'Payment service health check (v3)',
    description: 'Get comprehensive health status of payment services.'
  })
  @ApiResponse({ status: 200, description: 'Health status retrieved' })
  async getHealthStatus(): Promise<any> {
    try {
      const errorHealth = this.errorHandler.getErrorHealthStatus();
      
      return {
        status: 'healthy',
        timestamp: new Date(),
        version: '3.0.0',
        services: {
          paymentService: 'healthy',
          payTabsProvider: 'healthy',
          webhookSecurity: 'healthy',
          errorHandler: errorHealth.healthy ? 'healthy' : 'degraded',
        },
        metrics: {
          errorRate: errorHealth.errorRate,
          totalErrors: errorHealth.totalErrors,
          criticalErrors: errorHealth.criticalErrors,
        },
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date(),
        error: error.message,
      };
    }
  }

  @Get('v3/metrics/errors')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get error metrics (v3)',
    description: 'Get detailed error metrics and statistics.'
  })
  @ApiResponse({ status: 200, description: 'Error metrics retrieved' })
  async getErrorMetrics(): Promise<any> {
    try {
      const allMetrics = this.errorHandler.getAllErrorMetrics();
      const healthStatus = this.errorHandler.getErrorHealthStatus();

      return {
        timestamp: new Date(),
        healthy: healthStatus.healthy,
        summary: {
          totalErrors: healthStatus.totalErrors,
          criticalErrors: healthStatus.criticalErrors,
          errorRate: healthStatus.errorRate,
          topErrors: healthStatus.topErrors,
        },
        detailed: allMetrics,
      };

    } catch (error) {
      throw new HttpException(
        'Failed to retrieve error metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ============================================================================
  // V2 ENDPOINTS (Enhanced features)
  // ============================================================================

  @Post('v2/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create payment (v2)',
    description: 'Create payment with enhanced features (legacy v2 endpoint).'
  })
  async createPaymentV2(
    @Body() enhancedPaymentDto: EnhancedPaymentDto,
  ): Promise<BasePaymentResponseDto> {
    // Delegate to v3 endpoint with reduced features
    return this.createEnhancedPayment(enhancedPaymentDto);
  }

  @Post('v2/process/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Process payment (v2)',
    description: 'Process payment (legacy v2 endpoint).'
  })
  async processPaymentV2(
    @Param('id') paymentId: string,
    @Body() urls: { callback: string; return: string },
  ): Promise<PaymentRedirectResponseDto> {
    return this.processEnhancedPayment(paymentId, urls);
  }

  @Post('v2/webhook')
  @ApiOperation({ 
    summary: 'Handle webhook (v2)',
    description: 'Handle payment webhook (legacy v2 endpoint).'
  })
  async handleWebhookV2(
    @Body() callbackData: PaymentCallbackDto,
  ): Promise<BasePaymentResponseDto> {
    return this.handleEnhancedWebhook(callbackData);
  }

  // ============================================================================
  // V1 ENDPOINTS (Basic functionality - Legacy compatibility)
  // ============================================================================

  @Get('/')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get all payments (v1)',
    description: 'Retrieve all payments (legacy v1 endpoint).'
  })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getAllPayments(): Promise<Payment[]> {
    try {
      return await this.legacyPaymentService.All();
    } catch (error) {
      throw new HttpException(
        'Failed to retrieve payments',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Create payment (v1)',
    description: 'Create basic payment (legacy v1 endpoint).'
  })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto): Promise<Payment> {
    try {
      return await this.legacyPaymentService.create(createPaymentDto);
    } catch (error) {
      throw new HttpException(
        error.message || 'Payment creation failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('/pay/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get payment page (v1)',
    description: 'Get payment page URL (legacy v1 endpoint).'
  })
  @ApiParam({ name: 'id', description: 'Payment ID' })
  async getPaymentPage(
    @Param('id') paymentId: string,
    @Query('callback') callback: string,
    @Query('return') returnUrl: string,
  ): Promise<{ redirectUrl: string }> {
    try {
      const redirectUrl = await this.legacyPaymentService.Pay(paymentId, {
        callback,
        return: returnUrl,
      });

      return { redirectUrl };
    } catch (error) {
      throw new HttpException(
        error.message || 'Payment processing failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('/pay/callback')
  @ApiOperation({ 
    summary: 'Payment callback (v1)',
    description: 'Handle payment callback (legacy v1 endpoint).'
  })
  async handleCallback(@Body() callbackData: any): Promise<any> {
    try {
      return await this.legacyPaymentService.payCallback(callbackData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Callback processing failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('/pay/return')
  @ApiOperation({ 
    summary: 'Payment return (v1)',
    description: 'Handle payment return (legacy v1 endpoint).'
  })
  async handleReturn(@Body() returnData: any): Promise<any> {
    try {
      return await this.legacyPaymentService.payCallback(returnData);
    } catch (error) {
      throw new HttpException(
        error.message || 'Return processing failed',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private mapErrorToHttpStatus(errorType: string): HttpStatus {
    const statusMap: Record<string, HttpStatus> = {
      'INVALID_CREDENTIALS': HttpStatus.UNAUTHORIZED,
      'UNAUTHORIZED': HttpStatus.UNAUTHORIZED,
      'INVALID_PAYLOAD': HttpStatus.BAD_REQUEST,
      'INVALID_AMOUNT': HttpStatus.BAD_REQUEST,
      'INVALID_CURRENCY': HttpStatus.BAD_REQUEST,
      'CARD_DECLINED': HttpStatus.PAYMENT_REQUIRED,
      'INSUFFICIENT_FUNDS': HttpStatus.PAYMENT_REQUIRED,
      'SERVICE_UNAVAILABLE': HttpStatus.SERVICE_UNAVAILABLE,
      'TIMEOUT_ERROR': HttpStatus.REQUEST_TIMEOUT,
      'RATE_LIMIT_EXCEEDED': HttpStatus.TOO_MANY_REQUESTS,
      'FRAUD_DETECTED': HttpStatus.FORBIDDEN,
      'INVALID_SIGNATURE': HttpStatus.UNAUTHORIZED,
    };

    return statusMap[errorType] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  private generateCorrelationId(): string {
    return `ctrl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
