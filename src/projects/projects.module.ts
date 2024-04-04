import { Module } from '@nestjs/common';
import { RouterModule } from "@nestjs/core";
import { ProjectService } from './projects.service';
import { ProjectController } from './projects.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectSchema } from './models/project.schema';
import { StepsModule } from './projects-steps.module';
import { ProjectStepSchema } from './models/project-step.schema';
import { DesignsModule } from './projects-designs.module';
import { DesignSchema } from './models/design.schema';
import { NotesModule } from './projects-notes.module';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema },{name: 'Design', schema: DesignSchema},{name: 'ProjectStep', schema: ProjectStepSchema}]),
    NotesModule,DesignsModule,StepsModule,
    RouterModule.register([{
      path:"/api/projects",
      children:[{
        path:":/id/designs",
        module:DesignsModule
      },{
        path:":/id/notes",
        module:NotesModule
      },{
        path:":/id/steps",
        module:StepsModule
      }]
    }])
  ],
  providers: [ProjectService],
  exports: [ProjectService],
  controllers: [ProjectController ],
})
export class ProjectsModule {}
