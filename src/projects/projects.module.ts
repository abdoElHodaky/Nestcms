import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { ProjectController } from './projects.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectSchema } from './models/project.schema';
import { StepController } from './steps.controller';
import { ProjectStepSchema } from './models/project-step.schema';
import { DesignController } from './designs.controller';
import { DesignSchema } from './models/design.schema';
import { NoteController } from './notes.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema },{name: 'Design', schema: DesignSchema}, {name: 'ProjectStep', schema: ProjectStepSchema}])],
  providers: [ProjectService],
  exports: [ProjectService],
  controllers: [ProjectController,DesignController,StepController,NoteController],
})
export class ProjectsModule {}
