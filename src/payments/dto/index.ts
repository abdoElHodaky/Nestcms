/**
 * 🎯 **PAYMENT DTOs INDEX**
 * 
 * Centralized export for all payment-related DTOs.
 * Organized by category for better maintainability.
 * 
 * @author NestCMS Team
 * @version 3.0.0
 */

// ============================================================================
// BASE DTOs
// ============================================================================
export * from './base-payment.dto';

// ============================================================================
// SPECIFIC DTOs
// ============================================================================
export * from './create-payment.dto';
export * from './enhanced-payment.dto';
export * from './link-contract.dto';
export * from './payment-query.dto';

// ============================================================================
// LEGACY EXPORTS (Deprecated - will be removed in v4.0)
// ============================================================================
export { PaymentLinkToContractDto } from './link-contract.dto';
export { CreatePaymentDto } from './create-payment.dto';

// ============================================================================
// CONVENIENCE TYPE EXPORTS
// ============================================================================
export type {
  PaymentStatus,
  PaymentMethod,
  PaymentCurrency,
} from './base-payment.dto';

export type {
  PaymentSortBy,
  SortOrder,
} from './payment-query.dto';

export type {
  LinkingStatus,
} from './link-contract.dto';
