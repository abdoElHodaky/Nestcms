import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';
//import { ProjectController } from './projects.controller';
import { DesignController } from './designs.controller';
import { MongooseModule } from '@nestjs/mongoose';
//import { ProjectSchema } from './models/project.schema';
import { DesignSchema } from './models/design.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name :"Design" , schema :DesignSchema}])],
  providers: [ProjectService],
  exports: [ProjectService],
  controllers: [DesignController],
})
export class DesignsModule {}
