import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel('Payment') private readonly paymentModel: Model<any>
  ) {}

  async createPayment(paymentData: any, options?: any) {
    const payment = new this.paymentModel(paymentData);
    const savedPayment = await payment.save();
    
    // Return a result object that matches the expected interface
    return {
      success: true,
      transactionRef: savedPayment._id.toString(),
      redirectUrl: paymentData.redirectUrl,
      message: 'Payment created successfully',
      respCode: '200',
      respMessage: 'Success',
      fromFallback: false,
      executionTime: 0,
      retryCount: 0,
      data: savedPayment,
      correlationId: options?.correlationId,
      error: undefined,
    };
  }

  async findPaymentById(id: string) {
    return this.paymentModel.findById(id).exec();
  }

  async updatePayment(id: string, updateData: any) {
    return this.paymentModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deletePayment(id: string) {
    return this.paymentModel.findByIdAndDelete(id).exec();
  }

  async findAllPayments() {
    return this.paymentModel.find().exec();
  }

  async processPayment(paymentId: string, urls?: any, options?: any) {
    // Find the payment
    const payment = await this.findPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    // Update payment status to processing
    await this.updatePayment(paymentId, { status: 'processing' });

    // Return a result object that matches the expected interface
    return {
      success: true,
      transactionRef: payment._id.toString(),
      redirectUrl: urls?.redirectUrl || payment.redirectUrl,
      message: 'Payment processed successfully',
      respCode: '200',
      respMessage: 'Success',
      fromFallback: false,
      executionTime: 0,
      retryCount: 0,
      data: payment,
      correlationId: options?.correlationId,
      error: undefined,
    };
  }

  async verifyPayment(verificationDto: any, options?: any) {
    // Find the payment by transaction reference
    const payment = await this.paymentModel.findOne({ 
      transactionRef: verificationDto.transactionRef 
    }).exec();
    
    if (!payment) {
      return {
        success: false,
        message: 'Payment not found',
        respCode: '404',
        respMessage: 'Payment not found',
        fromFallback: false,
        executionTime: 0,
        retryCount: 0,
        data: null,
        correlationId: options?.correlationId,
        error: 'Payment not found',
      };
    }

    // Return verification result
    return {
      success: true,
      transactionRef: payment.transactionRef,
      status: payment.status,
      message: 'Payment verified successfully',
      respCode: '200',
      respMessage: 'Success',
      fromFallback: false,
      executionTime: 0,
      retryCount: 0,
      data: payment,
      correlationId: options?.correlationId,
      error: undefined,
    };
  }

  async handleCallback(callbackData: any, options?: any) {
    // Find the payment by transaction reference
    const payment = await this.paymentModel.findOne({ 
      transactionRef: callbackData.transactionRef 
    }).exec();
    
    if (!payment) {
      return {
        success: false,
        message: 'Payment not found for callback',
        respCode: '404',
        respMessage: 'Payment not found',
        fromFallback: false,
        executionTime: 0,
        retryCount: 0,
        data: null,
        correlationId: options?.correlationId,
        error: 'Payment not found',
      };
    }

    // Update payment status based on callback
    const updatedPayment = await this.updatePayment(payment._id, {
      status: callbackData.status,
      callbackData: callbackData,
      updatedAt: new Date(),
    });

    return {
      success: true,
      transactionRef: payment.transactionRef,
      status: callbackData.status,
      message: 'Callback processed successfully',
      respCode: '200',
      respMessage: 'Success',
      fromFallback: false,
      executionTime: 0,
      retryCount: 0,
      data: updatedPayment,
      correlationId: options?.correlationId,
      error: undefined,
    };
  }
}
