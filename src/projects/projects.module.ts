import { Module } from '@nestjs/common';
import { ProjectWorkerService ,ProjectService} from './services/';
import { ProjectController,WorkerController,
        StepController,DesignController,
        NoteController
       } from './controllers/';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectSchema } from './models/project.schema';
import { ProjectStepSchema } from './models/project-step.schema';
import { ProjectWorkerSchema} from './models/worker.schema'
import { DesignSchema } from './models/design.schema';
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
