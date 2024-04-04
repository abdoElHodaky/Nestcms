import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';

//import { MongooseModule } from '@nestjs/mongoose';
import { DesignController } from './designs.controller';
//import { DesignSchema } from './models/design.schema';
@Module({
  imports: [],
  providers: [ProjectService ],
  exports: [ProjectService ],
  controllers: [DesignController],
})
export class DesignsModule {}
