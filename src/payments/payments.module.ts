/**
 * 🎯 **PAYMENTS MODULE - REORGANIZED ARCHITECTURE**
 * 
 * Consolidated payments module using the new unified architecture.
 * Eliminates duplications while maintaining backward compatibility.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';

// ============================================================================
// SCHEMAS
// ============================================================================
import { PaymentSchema } from './models/payment.schema';

// ============================================================================
// UNIFIED SERVICES (New Architecture)
// ============================================================================
import { PaymentService } from './services/core/payment.service';
import { PayTabsProviderService } from './services/providers/paytabs-provider.service';
import { PaymentErrorHandlerService } from './services/error/payment-error-handler.service';
import { PaymentEventService } from './services/events/payment-events.service';

// ============================================================================
// EXISTING SPECIALIZED SERVICES (Kept for specific functionality)
// ============================================================================
import { WebhookSecurityService } from './services/webhook-security.service';

// ============================================================================
// LEGACY SERVICES (For backward compatibility - will be deprecated in v4.0)
// ============================================================================
import { PaymentService as LegacyPaymentService } from './payments.service';
import { PayTabService } from '../paytabs.service';

// ============================================================================
// UNIFIED CONTROLLER
// ============================================================================
import { PaymentController } from './payment.controller';

// ============================================================================
// LEGACY CONTROLLERS (For backward compatibility - will be deprecated in v4.0)
// ============================================================================
import { PaymentController as LegacyPaymentController } from './payments.controller';

// ============================================================================
// EXTERNAL MODULES
// ============================================================================
import { CircuitBreakerModule } from '../circuit-breaker/circuit-breaker.module';
import { CacheModule } from '../cache/cache.module';
import { UsersModule } from '../users/users.module';
import { ContractsModule } from '../contracts/contracts.module';

@Module({
  imports: [
    // Database
    MongooseModule.forFeature([{ name: 'Payment', schema: PaymentSchema }]),
    
    // Configuration
    ConfigModule,
    
    // Event System
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 50, // Increased for comprehensive event handling
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    
    // External Modules
    CircuitBreakerModule,
    CacheModule,
    
    // Related Modules (with forwardRef to avoid circular dependencies)
    forwardRef(() => UsersModule),
    forwardRef(() => ContractsModule),
  ],
  
  providers: [
    // ========================================================================
    // UNIFIED SERVICES (Primary Architecture)
    // ========================================================================
    {
      provide: PaymentService,
      useClass: PaymentService,
    },
    {
      provide: PayTabsProviderService,
      useClass: PayTabsProviderService,
    },
    {
      provide: PaymentErrorHandlerService,
      useClass: PaymentErrorHandlerService,
    },
    {
      provide: PaymentEventService,
      useClass: PaymentEventService,
    },
    
    // ========================================================================
    // SPECIALIZED SERVICES (Kept for specific functionality)
    // ========================================================================
    {
      provide: WebhookSecurityService,
      useClass: WebhookSecurityService,
    },
    
    // ========================================================================
    // LEGACY SERVICES (Backward Compatibility - Deprecated in v4.0)
    // ========================================================================
    {
      provide: LegacyPaymentService,
      useClass: LegacyPaymentService,
    },
    {
      provide: PayTabService,
      useClass: PayTabService,
    },
  ],
  
  controllers: [
    // ========================================================================
    // UNIFIED CONTROLLER (Primary API)
    // ========================================================================
    PaymentController,
    
    // ========================================================================
    // LEGACY CONTROLLERS (Backward Compatibility - Deprecated in v4.0)
    // ========================================================================
    {
      path: 'legacy',
      provide: LegacyPaymentController,
      useClass: LegacyPaymentController,
    },
  ],
  
  exports: [
    // ========================================================================
    // UNIFIED SERVICES (For use by other modules)
    // ========================================================================
    PaymentService,
    PayTabsProviderService,
    PaymentErrorHandlerService,
    PaymentEventService,
    WebhookSecurityService,
    
    // ========================================================================
    // LEGACY SERVICES (For backward compatibility)
    // ========================================================================
    LegacyPaymentService,
    PayTabService,
    
    // ========================================================================
    // MONGOOSE MODEL (For direct database access if needed)
    // ========================================================================
    MongooseModule,
  ],
})
export class PaymentsModule {
  constructor(
    private readonly paymentEventService: PaymentEventService,
  ) {
    // Initialize event listeners for monitoring
    this.paymentEventService.setupInternalListeners();
  }

  /**
   * Module cleanup
   */
  onModuleDestroy() {
    this.paymentEventService.removeInternalListeners();
  }
}

// ============================================================================
// DEPRECATION NOTICES
// ============================================================================

/**
 * @deprecated The following services will be removed in v4.0:
 * - LegacyPaymentService (use PaymentService instead)
 * - PayTabService (use PayTabsProviderService instead)
 * - LegacyPaymentController (use PaymentController instead)
 * 
 * Migration Guide:
 * 1. Replace LegacyPaymentService with PaymentService
 * 2. Replace PayTabService with PayTabsProviderService
 * 3. Update API endpoints to use versioned routes (/payments/v3/*)
 * 4. Update DTOs to extend BasePaymentDto
 * 5. Add proper error handling using PaymentErrorHandlerService
 */

/**
 * @deprecated The following controllers will be removed in v4.0:
 * - EnhancedPaymentsV3Controller (functionality moved to PaymentController v3 endpoints)
 * - EventDrivenPaymentController (functionality moved to PaymentController v3 endpoints)
 * 
 * All functionality has been consolidated into the unified PaymentController
 * with versioned endpoints for backward compatibility.
 */

