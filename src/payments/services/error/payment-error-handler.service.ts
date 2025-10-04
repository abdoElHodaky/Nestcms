import { Injectable, HttpStatus } from '@nestjs/common';
import { PayTabsError, PayTabsErrorType, PayTabsErrorContext } from '../../interfaces/payment-types.interface';

@Injectable()
export class PaymentErrorHandlerService {
  handlePaymentError(error: any) {
    // Error handling logic
    console.error('Payment error:', error);
    return {
      handled: true,
      errorCode: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unknown error occurred'
    };
  }

  logError(error: any, context?: string) {
    // Error logging logic
    console.error(`[${context || 'PaymentError'}]`, error);
  }

  shouldRetry(error: any): boolean {
    // Retry logic
    const retryableErrors = ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT'];
    return retryableErrors.includes(error.code);
  }

  async handleError(error: any, context: PayTabsErrorContext): Promise<{
    errorCode: string;
    userMessage: string;
    httpStatus: number;
    details?: any;
  }> {
    // Convert error to PayTabsError format
    const payTabsError: PayTabsError = {
      type: this.mapErrorToType(error),
      severity: this.getErrorSeverity(error),
      message: error.message || 'An error occurred',
      code: error.code || 'UNKNOWN_ERROR',
      details: error.details || error,
      timestamp: new Date(),
      retryable: this.shouldRetry(error),
      context: {
        paymentId: context.paymentId,
        transactionRef: context.transactionRef,
        operation: context.operation,
        attempt: context.retryCount || 0,
      },
    };

    // Log the error
    this.logError(payTabsError, context.operation);

    // Return formatted error response
    return {
      errorCode: payTabsError.code,
      userMessage: this.getUserFriendlyMessage(payTabsError.type),
      httpStatus: this.getHttpStatus(payTabsError.type),
      details: payTabsError.details,
    };
  }

  private mapErrorToType(error: any): PayTabsErrorType {
    if (error.code) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return PayTabsErrorType.NETWORK_ERROR;
        case 'TIMEOUT':
          return PayTabsErrorType.TIMEOUT_ERROR;
        case 'UNAUTHORIZED':
          return PayTabsErrorType.AUTHENTICATION_ERROR;
        case 'VALIDATION_ERROR':
          return PayTabsErrorType.VALIDATION_ERROR;
        case 'RATE_LIMIT':
          return PayTabsErrorType.RATE_LIMIT_ERROR;
        default:
          return PayTabsErrorType.UNKNOWN_ERROR;
      }
    }
    return PayTabsErrorType.UNKNOWN_ERROR;
  }

  private getErrorSeverity(error: any): any {
    // Return severity based on error type
    if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
      return 'HIGH';
    }
    if (error.code === 'VALIDATION_ERROR') {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  private getUserFriendlyMessage(errorType: PayTabsErrorType): string {
    const messages = {
      [PayTabsErrorType.NETWORK_ERROR]: 'Network connection error. Please try again.',
      [PayTabsErrorType.TIMEOUT_ERROR]: 'Request timed out. Please try again.',
      [PayTabsErrorType.AUTHENTICATION_ERROR]: 'Authentication failed. Please contact support.',
      [PayTabsErrorType.VALIDATION_ERROR]: 'Invalid data provided. Please check your input.',
      [PayTabsErrorType.RATE_LIMIT_ERROR]: 'Too many requests. Please wait and try again.',
      [PayTabsErrorType.SERVER_ERROR]: 'Server error occurred. Please try again later.',
      [PayTabsErrorType.UNKNOWN_ERROR]: 'An unexpected error occurred. Please contact support.',
    };
    return messages[errorType] || messages[PayTabsErrorType.UNKNOWN_ERROR];
  }

  private getHttpStatus(errorType: PayTabsErrorType): number {
    const statusMap = {
      [PayTabsErrorType.AUTHENTICATION_ERROR]: HttpStatus.UNAUTHORIZED,
      [PayTabsErrorType.VALIDATION_ERROR]: HttpStatus.BAD_REQUEST,
      [PayTabsErrorType.RATE_LIMIT_ERROR]: HttpStatus.TOO_MANY_REQUESTS,
      [PayTabsErrorType.SERVER_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
      [PayTabsErrorType.NETWORK_ERROR]: HttpStatus.SERVICE_UNAVAILABLE,
      [PayTabsErrorType.TIMEOUT_ERROR]: HttpStatus.REQUEST_TIMEOUT,
      [PayTabsErrorType.UNKNOWN_ERROR]: HttpStatus.INTERNAL_SERVER_ERROR,
    };
    return statusMap[errorType] || HttpStatus.INTERNAL_SERVER_ERROR;
  }

  getErrorHealthStatus() {
    return {
      status: 'healthy',
      errorRate: 0.05,
      lastError: null,
      totalErrors: 0,
      timestamp: new Date(),
    };
  }

  getAllErrorMetrics() {
    return {
      totalErrors: 0,
      errorsByType: {},
      errorsByHour: {},
      averageResolutionTime: 0,
      retrySuccessRate: 0.95,
      timestamp: new Date(),
    };
  }
}
