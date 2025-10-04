import { Injectable } from '@nestjs/common';

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
}
