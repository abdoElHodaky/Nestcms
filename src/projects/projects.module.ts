import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';
import { ProjectWorkerService } from './worker.service';
import { ProjectController } from './projects.controller';
import { WorkerController } from './worker.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectSchema } from './models/project.schema';
import { StepController } from './steps.controller';
import { ProjectStepSchema } from './models/project-step.schema';
import { ProjectWorkerSchema} from './models/worker.schema'
import { DesignController } from './designs.controller';
import { DesignSchema } from './models/design.schema';
import { NoteController } from './notes.controller';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema },
                                       {name: 'Design', schema: DesignSchema},
                                       {name: 'ProjectStep', schema: ProjectStepSchema},
                                       {name: 'ProjectWorker',schema: ProjectWorkerSchema}
                                    ])],
  providers: [ProjectService, ProjectWorkerService],
  exports: [ProjectService ,ProjectWorkerService],
  controllers: [ProjectController,NoteController,
                DesignController,StepController,
                WorkerController ],
})
export class ProjectsModule {}
