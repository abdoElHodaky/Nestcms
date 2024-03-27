import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { ProjectController } from './projects.controller';
import { DesignController } from './design.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectSchema } from './models/project.schema';
import { DesignSchema } from './models/design.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema },{ name :"Design" , schema :DesignSchema}])],
  providers: [ProjectService],
  exports: [ProjectService],
  controllers: [ProjectController,DesignController],
})
export class ProjectsModule {}
