import { Module } from '@nestjs/common';
import { PaymentService } from './payments.service';
import { PayTabService } from "../paytabs.service";
import { PaymentController } from './payments.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentSchema } from './models/payment.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Payment', schema: PaymentSchema }])],
  providers: [PaymentService,PayTabService ],
  exports: [PaymentService,PayTabService ],
  controllers: [PaymentController],
})
export class PaymentsModule {}
