/**
 * 🎯 **PAYMENTS SERVICES - CONSOLIDATED EXPORTS**
 * 
 * Centralized export point for all payment-related services.
 * Organized by domain for better maintainability and dependency management.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

// ============================================================================
// CORE SERVICES (Main Business Logic)
// ============================================================================
export * from './core/payment.service';

// ============================================================================
// PROVIDER SERVICES (External Integrations)
// ============================================================================
export * from './providers/paytabs-provider.service';

// ============================================================================
// INFRASTRUCTURE SERVICES (Cross-cutting Concerns)
// ============================================================================
export * from './infrastructure/paytabs-error-handler.service';
export * from './infrastructure/webhook-security.service';

// ============================================================================
// EVENT SERVICES (Event Management)
// ============================================================================
export * from './events/payment-events.service';

// ============================================================================
// ERROR HANDLING SERVICES
// ============================================================================
export * from './error/payment-error-handler.service';

// ============================================================================
// ENHANCED SERVICES (Advanced Features)
// ============================================================================
export * from './enhanced/enhanced-paytabs.service';
export * from './enhanced/enhanced-paytabs-resilient.service';
export * from './enhanced/event-driven-payment.service';
