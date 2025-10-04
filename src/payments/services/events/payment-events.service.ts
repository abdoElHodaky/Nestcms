import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PaymentEventService {
  constructor(private eventEmitter: EventEmitter2) {}

  emitPaymentCreated(paymentData: any) {
    this.eventEmitter.emit('payment.created', paymentData);
  }

  emitPaymentCompleted(paymentData: any) {
    this.eventEmitter.emit('payment.completed', paymentData);
  }

  emitPaymentFailed(paymentData: any, error: any) {
    this.eventEmitter.emit('payment.failed', { paymentData, error });
  }

  emitPaymentRefunded(paymentData: any) {
    this.eventEmitter.emit('payment.refunded', paymentData);
  }

  /**
   * Setup internal event listeners for monitoring
   */
  setupInternalListeners(): void {
    // Set up internal listeners for payment events
    this.eventEmitter.on('payment.*', (data) => {
      // Internal monitoring logic can be added here
      console.log('Payment event received:', data);
    });
  }

  /**
   * Remove internal event listeners
   */
  removeInternalListeners(): void {
    // Remove internal listeners
    this.eventEmitter.removeAllListeners('payment.*');
  }
}
