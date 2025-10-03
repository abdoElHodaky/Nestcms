import { 
  Controller, 
  Post, 
  Body, 
  Get, 
  Param, 
  Query,
  UseGuards, 
  Request, 
  Headers,
  RawBody,
  Ip,
  HttpStatus,
  HttpException,
  Logger,
  ValidationPipe,
  UsePipes,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { EnhancedPaymentService } from './enhanced-payment.service';
import { EnhancedPayTabsService } from './enhanced-paytabs.service';
import { CircuitBreakerService } from '../common/circuit-breaker.service';

@ApiTags('Enhanced Payments')
@Controller('payments/v2')
@UseGuards(ThrottlerGuard)
export class EnhancedPaymentController {
  private readonly logger = new Logger(EnhancedPaymentController.name);

  constructor(
    private readonly enhancedPaymentService: EnhancedPaymentService,
    private readonly enhancedPayTabsService: EnhancedPayTabsService,
    private readonly circuitBreakerService: CircuitBreakerService
  ) {}

  @Get()
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ description: 'Get user payments with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getUserPayments(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ) {
    try {
      return await this.enhancedPaymentService.getPaymentsForUser(
        req.user.id,
        Math.max(1, page),
        Math.min(50, Math.max(1, limit)) // Limit between 1-50
      );
    } catch (error) {
      this.logger.error('Error getting user payments:', error);
      throw new HttpException('Failed to retrieve payments', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('create')
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @UsePipes(new ValidationPipe({ transform: true }))
  @ApiOperation({ description: 'Create a new payment with enhanced error handling' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid payment data' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createPayment(@Body() createPaymentDto: CreatePaymentDto) {
    try {
      this.logger.log('Creating payment', { contractId: createPaymentDto.contractId });
      return await this.enhancedPaymentService.create(createPaymentDto);
    } catch (error) {
      this.logger.error('Payment creation failed:', error);
      
      if (error.status) {
        throw error; // Re-throw HTTP exceptions
      }
      
      throw new HttpException('Payment creation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('process/:id')
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  @ApiOperation({ description: 'Process payment with circuit breaker protection' })
  @ApiResponse({ status: 200, description: 'Payment processing initiated' })
  @ApiResponse({ status: 400, description: 'Invalid payment ID or state' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 503, description: 'Payment service unavailable' })
  async processPayment(
    @Param('id') paymentId: string,
    @Request() req,
    @Query('paymentMethods') paymentMethods?: string,
    @Query('language') language?: string
  ) {
    try {
      this.logger.log('Processing payment', { paymentId });

      const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
      const urls = {
        callback: `${baseUrl}/webhook`,
        return: `${baseUrl}/return`,
      };

      const options = {
        paymentMethods: paymentMethods ? paymentMethods.split(',') : ['all'],
        language: language || 'EN',
      };

      const result = await this.enhancedPaymentService.processPayment(paymentId, urls, options);

      if (result.success) {
        return {
          success: true,
          redirectUrl: result.redirectUrl,
          message: 'Payment processing initiated successfully',
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: 'Payment processing failed',
            error: result.error,
          },
          HttpStatus.BAD_REQUEST
        );
      }

    } catch (error) {
      this.logger.error('Payment processing error:', error);
      
      if (error.status) {
        throw error;
      }

      // Check if it's a circuit breaker error
      if (error.message?.includes('circuit') || error.message?.includes('breaker')) {
        throw new HttpException(
          'Payment service is temporarily unavailable. Please try again later.',
          HttpStatus.SERVICE_UNAVAILABLE
        );
      }

      throw new HttpException('Payment processing failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('webhook')
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 webhooks per minute
  @ApiOperation({ description: 'Secure webhook endpoint with signature verification' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid webhook data' })
  @ApiResponse({ status: 401, description: 'Webhook authentication failed' })
  @ApiResponse({ status: 429, description: 'Too many webhook requests' })
  async handleWebhook(
    @RawBody() rawBody: Buffer,
    @Headers() headers: Record<string, string>,
    @Ip() clientIP: string
  ) {
    const startTime = Date.now();
    
    try {
      this.logger.log('Webhook received', { 
        contentLength: rawBody.length,
        clientIP,
        userAgent: headers['user-agent'],
      });

      const result = await this.enhancedPaymentService.handleWebhook(rawBody, headers, clientIP);
      
      const executionTime = Date.now() - startTime;
      
      this.logger.log('Webhook processed', {
        success: result.success,
        executionTime,
        clientIP,
      });

      if (result.success) {
        return {
          success: true,
          message: result.message,
          data: result.data,
          executionTime,
        };
      } else {
        throw new HttpException(
          {
            success: false,
            message: result.message,
            executionTime,
          },
          HttpStatus.BAD_REQUEST
        );
      }

    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.logger.error('Webhook processing error:', error, {
        clientIP,
        executionTime,
      });

      if (error.status) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: 'Webhook processing failed',
          executionTime,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('return')
  @ApiOperation({ description: 'Payment return endpoint' })
  @ApiResponse({ status: 200, description: 'Payment return processed' })
  async handleReturn(@Body() returnData: any) {
    try {
      this.logger.log('Payment return received', { 
        transactionRef: returnData?.transRef,
        status: returnData?.respStatus,
      });

      // Process return data (similar to webhook but for user redirects)
      const callbackResult = await this.enhancedPayTabsService.processCallback(returnData);
      
      if (callbackResult.paymentId) {
        const verificationResult = await this.enhancedPaymentService.verifyPayment(
          callbackResult.transactionRef,
          callbackResult.paymentId
        );

        return {
          success: verificationResult.success,
          message: verificationResult.message,
          transactionRef: callbackResult.transactionRef,
          status: callbackResult.status,
        };
      }

      return {
        success: false,
        message: 'Invalid return data',
      };

    } catch (error) {
      this.logger.error('Payment return processing error:', error);
      
      return {
        success: false,
        message: 'Return processing failed',
        error: error.message,
      };
    }
  }

  @Get('verify/:transactionRef/:paymentId')
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 verifications per minute
  @ApiOperation({ description: 'Manually verify payment' })
  @ApiResponse({ status: 200, description: 'Payment verification completed' })
  @ApiResponse({ status: 400, description: 'Invalid verification parameters' })
  @ApiResponse({ status: 429, description: 'Too many verification requests' })
  async verifyPayment(
    @Param('transactionRef') transactionRef: string,
    @Param('paymentId') paymentId: string
  ) {
    try {
      this.logger.log('Manual payment verification', { transactionRef, paymentId });

      const result = await this.enhancedPaymentService.verifyPayment(transactionRef, paymentId);

      return {
        success: result.success,
        message: result.message,
        payment: result.payment,
        error: result.error,
      };

    } catch (error) {
      this.logger.error('Payment verification error:', error);
      
      if (error.status) {
        throw error;
      }

      throw new HttpException('Payment verification failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('stats')
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ description: 'Get payment statistics' })
  @ApiQuery({ name: 'clientId', required: false, type: String })
  @ApiQuery({ name: 'contractId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved' })
  async getPaymentStats(
    @Query('clientId') clientId?: string,
    @Query('contractId') contractId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string
  ) {
    try {
      const filters: any = {};
      
      if (clientId) filters.clientId = clientId;
      if (contractId) filters.contractId = contractId;
      if (dateFrom) filters.dateFrom = new Date(dateFrom);
      if (dateTo) filters.dateTo = new Date(dateTo);

      return await this.enhancedPaymentService.getPaymentStats(filters);

    } catch (error) {
      this.logger.error('Error getting payment statistics:', error);
      throw new HttpException('Failed to get payment statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('health')
  @ApiOperation({ description: 'Payment service health check' })
  @ApiResponse({ status: 200, description: 'Service health status' })
  async healthCheck() {
    try {
      const [payTabsHealth, circuitBreakerHealth] = await Promise.all([
        this.enhancedPayTabsService.healthCheck(),
        this.circuitBreakerService.healthCheck(),
      ]);

      const overallHealth = payTabsHealth.status === 'healthy' && circuitBreakerHealth.healthy;

      return {
        status: overallHealth ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        services: {
          payTabs: payTabsHealth,
          circuitBreakers: circuitBreakerHealth,
        },
        version: '2.0.0',
      };

    } catch (error) {
      this.logger.error('Health check error:', error);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        version: '2.0.0',
      };
    }
  }

  @Get('circuit-breaker/stats')
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ description: 'Get circuit breaker statistics' })
  @ApiResponse({ status: 200, description: 'Circuit breaker statistics' })
  async getCircuitBreakerStats() {
    try {
      return {
        payTabs: this.enhancedPayTabsService.getCircuitBreakerStats(),
        overall: this.circuitBreakerService.getAllStats(),
      };
    } catch (error) {
      this.logger.error('Error getting circuit breaker stats:', error);
      throw new HttpException('Failed to get circuit breaker statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('circuit-breaker/:name/reset')
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ description: 'Reset circuit breaker' })
  @ApiResponse({ status: 200, description: 'Circuit breaker reset successfully' })
  @ApiResponse({ status: 404, description: 'Circuit breaker not found' })
  async resetCircuitBreaker(@Param('name') name: string) {
    try {
      const success = this.circuitBreakerService.reset(name);
      
      if (success) {
        return {
          success: true,
          message: `Circuit breaker '${name}' reset successfully`,
        };
      } else {
        throw new HttpException(
          `Circuit breaker '${name}' not found`,
          HttpStatus.NOT_FOUND
        );
      }

    } catch (error) {
      this.logger.error(`Error resetting circuit breaker '${name}':`, error);
      
      if (error.status) {
        throw error;
      }

      throw new HttpException('Failed to reset circuit breaker', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':id')
  @ApiBearerAuth('JWTAuthorization')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ description: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Payment not found' })
  async getPaymentById(@Param('id') id: string) {
    try {
      const payment = await this.enhancedPaymentService.findById(id);
      
      if (!payment) {
        throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
      }

      return payment;

    } catch (error) {
      this.logger.error(`Error getting payment ${id}:`, error);
      
      if (error.status) {
        throw error;
      }

      throw new HttpException('Failed to retrieve payment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

