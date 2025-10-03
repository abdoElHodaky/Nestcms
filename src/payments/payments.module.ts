import { Module } from '@nestjs/common';
import { PaymentService } from './payments.service';
import { PayTabService } from "../paytabs.service";
import { PaymentController } from './payments.controller';
import { EnhancedPaymentService } from './enhanced-payment.service';
import { EnhancedPayTabsService } from './enhanced-paytabs.service';
import { EnhancedPaymentController } from './enhanced-payment.controller';
import { WebhookSecurityService } from './webhook-security.service';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentSchema } from './models/payment.schema';
import { CacheModule } from '../cache/cache.module';
import { ContractsModule } from '../contracts/contracts.module';
import { UsersModule } from '../users/users.module';
import { CircuitBreakerService } from '../common/circuit-breaker.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Payment', schema: PaymentSchema }]),
    CacheModule,
    ContractsModule,
    UsersModule,
  ],
  providers: [
    PaymentService,
    PayTabService,
    EnhancedPaymentService,
    EnhancedPayTabsService,
    WebhookSecurityService,
    CircuitBreakerService,
  ],
  exports: [
    PaymentService,
    PayTabService,
    EnhancedPaymentService,
    EnhancedPayTabsService,
    WebhookSecurityService,
  ],
  controllers: [
    PaymentController,
    EnhancedPaymentController,
  ],
})
export class PaymentsModule {}
