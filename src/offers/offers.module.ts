import { Module } from '@nestjs/common';
import { OfferService } from './offers.service';
import { OfferController } from './offers.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OfferSchema } from './models/offer.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Offer', schema: OfferSchema }])],
  providers: [OfferService],
  exports: [OfferService],
  controllers: [OfferController],
})
export class OffersModule {}
