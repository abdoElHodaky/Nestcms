/**
 * 🎯 **PAYMENTS CONTROLLERS - VERSIONED EXPORTS**
 * 
 * Centralized export point for all payment controllers.
 * Organized by API version for backward compatibility.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

// ============================================================================
// VERSION 1 CONTROLLERS (Legacy - Deprecated in v4.0)
// ============================================================================
export { PaymentController as PaymentControllerV1 } from './v1/payments.controller';

// ============================================================================
// VERSION 2 CONTROLLERS (Current Stable)
// ============================================================================
export { PaymentController as PaymentControllerV2 } from './v2/payment.controller';

// ============================================================================
// VERSION 3 CONTROLLERS (Enhanced Features)
// ============================================================================
export { EnhancedPaymentsV3Controller } from './v3/enhanced-payments-v3.controller';
export { EventDrivenPaymentController } from './v3/event-driven-payment.controller';

// ============================================================================
// DEFAULT EXPORTS (Latest Stable Version)
// ============================================================================
export { PaymentController as PaymentController } from './v2/payment.controller';
