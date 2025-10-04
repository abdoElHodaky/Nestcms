import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class PaymentService {
  constructor(
    @InjectModel('Payment') private readonly paymentModel: Model<any>
  ) {}

  async createPayment(paymentData: any) {
    const payment = new this.paymentModel(paymentData);
    return payment.save();
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
}
