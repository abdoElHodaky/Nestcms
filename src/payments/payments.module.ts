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

// Event-driven architecture services
import { EventDrivenPaymentService } from './services/event-driven-payment.service';
import { EventDrivenPaymentController } from './controllers/event-driven-payment.controller';
import { EventDrivenCircuitBreakerService } from '../circuit-breaker/event-driven-circuit-breaker.service';

// Import required modules
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Payment', schema: PaymentSchema }]),
    ConfigModule,
    EventEmitterModule.forRoot({
      // Event emitter configuration for event-driven architecture
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
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
    
    // Event-driven architecture services
    EventDrivenPaymentService,
    EventDrivenCircuitBreakerService,
  ],
  exports: [
    // Original services
    PaymentService,
    PayTabService,
    
    // Enhanced services
    PayTabsErrorHandlerService,
    WebhookSecurityService,
    EnhancedPayTabsResilientService,
    
    // Event-driven services
    EventDrivenPaymentService,
    EventDrivenCircuitBreakerService,
  ],
  controllers: [
    // Original controller
    PaymentController,
    
    // Enhanced controller with comprehensive error handling
    EnhancedPaymentsV3Controller,
    
    // Event-driven controller with circuit breaker integration
    EventDrivenPaymentController,
  ],
})
export class PaymentsModule {}
