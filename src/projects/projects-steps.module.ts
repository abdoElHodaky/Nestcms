import { Module } from '@nestjs/common';
//import { MongooseModule } from '@nestjs/mongoose';
import { StepController } from './steps.controller';
//import { DesignSchema } from './models/design.schema';
@Module({
  imports: [],
  providers: [],
  exports: [],
  controllers: [StepController],
})
export class StepsModule {}