/**
 * 🎯 **PAYMENTS INTERFACES - CONSOLIDATED EXPORTS**
 * 
 * Centralized export point for all payment-related interfaces.
 * Organized by domain for better maintainability.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 * @since 2024-01-15
 */

// ============================================================================
// CORE INTERFACES
// ============================================================================
export * from './core/payment.interface';

// ============================================================================
// EVENT INTERFACES
// ============================================================================
export * from './events/payment-events.interface';

// ============================================================================
// ERROR INTERFACES
// ============================================================================
// Export specific interfaces to avoid conflicts
export {
  PayTabsError,
  PayTabsErrorType,
  PayTabsErrorSeverity,
  ErrorRecoveryStrategy,
  PaymentFailureContext,
  WebhookSecurityConfig,
  WebhookValidationResult,
  PaymentRecoveryOptions,
  PaymentHealthMetrics,
  PaymentAuditLog,
  PaymentRecoveryResult,
  CircuitBreakerConfig as PayTabsCircuitBreakerConfig,
  AlertConfig as PayTabsAlertConfig,
} from './errors/paytabs-errors.interface';

// ============================================================================
// TYPE INTERFACES
// ============================================================================
export {
  PaymentEventType,
  PaymentErrorEvent,
  PaymentEventPriority,
  PaymentEventStatus,
  SecurityEvent,
  CircuitBreakerConfig,
  AlertConfig,
} from './types/payment-types.interface';
