import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';

//import { MongooseModule } from '@nestjs/mongoose';
import { StepController } from './steps.controller';
//import { DesignSchema } from './models/design.schema';
@Module({
  imports: [],
  providers: [ProjectService ],
  exports: [ ],
  controllers: [StepController],
})
export class StepsModule {}
