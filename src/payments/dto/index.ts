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

// ============================================================================
// LEGACY EXPORTS (Deprecated - will be removed in v4.0)
// ============================================================================
export { PaymentLinkToContractDto } from './link-contract.dto';
export { CreatePaymentDto } from './create-payment.dto';

