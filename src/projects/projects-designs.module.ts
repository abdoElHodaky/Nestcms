import { Module } from '@nestjs/common';
//import { MongooseModule } from '@nestjs/mongoose';
import { DesignController } from './designs.controller';
//import { DesignSchema } from './models/design.schema';
@Module({
  imports: [],
  providers: [],
  exports: [],
  controllers: [DesignController],
})
export class DesignsModule {}
