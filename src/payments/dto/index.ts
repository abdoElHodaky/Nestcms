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
// REQUEST DTOs (Organized by Domain)
// ============================================================================
export * from './requests';

// ============================================================================
// RESPONSE DTOs (Organized by Domain)
// ============================================================================
export * from './responses';

// ============================================================================
// EVENT DTOs (Organized by Domain)
// ============================================================================
export * from './events';

// ============================================================================
// LEGACY EXPORTS (Deprecated - will be removed in v4.0)
// ============================================================================
export { PaymentLinkToContractDto } from './requests/link-contract.dto';
export { CreatePaymentDto } from './requests/create-payment.dto';

// ============================================================================
// CONVENIENCE TYPE EXPORTS
// ============================================================================
export type {
  PaymentStatus,
  PaymentMethod,
  PaymentCurrency,
  PaymentPriority,
} from './base-payment.dto';

export type {
  PaymentSortBy,
  SortOrder,
} from './requests/payment-query.dto';

export type {
  LinkingStatus,
} from './requests/link-contract.dto';
