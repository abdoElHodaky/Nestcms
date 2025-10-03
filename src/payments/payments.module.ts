import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

// Original services
import { PaymentService } from './payments.service';
import { PayTabService } from "../paytabs.service";
import { PaymentController } from './payments.controller';
import { PaymentSchema } from './models/payment.schema';

// Enhanced services with error handling and resilience
import { PayTabsErrorHandlerService } from './services/paytabs-error-handler.service';
import { WebhookSecurityService } from './services/webhook-security.service';
import { EnhancedPayTabsResilientService } from './services/enhanced-paytabs-resilient.service';
import { EnhancedPaymentsV3Controller } from './controllers/enhanced-payments-v3.controller';

// Import required modules
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Payment', schema: PaymentSchema }]),
    ConfigModule,
    EventEmitterModule,
    CircuitBreakerModule,
    CacheModule,
  ],
  providers: [
    // Original services
    PaymentService,
    PayTabService,
    
    // Enhanced services with error handling and resilience
    PayTabsErrorHandlerService,
    WebhookSecurityService,
    EnhancedPayTabsResilientService,
  ],
  exports: [
    // Original services
    PaymentService,
    PayTabService,
    
    // Enhanced services
    PayTabsErrorHandlerService,
    WebhookSecurityService,
    EnhancedPayTabsResilientService,
  ],
  controllers: [
    // Original controller
    PaymentController,
    
    // Enhanced controller with comprehensive error handling
    EnhancedPaymentsV3Controller,
  ],
})
export class PaymentsModule {}
