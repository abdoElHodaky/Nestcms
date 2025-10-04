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
}
