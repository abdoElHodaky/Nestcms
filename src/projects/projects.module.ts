import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { ProjectController } from './projects.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectSchema } from './models/project.schema';
import { DesignsModule} from "./designs.module";
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema }]),DesignsModule],
  providers: [ProjectService],
  exports: [ProjectService],
  controllers: [ProjectController],
})
export class ProjectsModule {}
