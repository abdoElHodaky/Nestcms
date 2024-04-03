import { Module } from '@nestjs/common';
import { ScheduleService } from './schedules.service';
import { ScheduleProjectService } from "./schedules-projects.service";
import { ScheduleController } from './schedules.controller';
import { ScheduleProjectController } from "./schedules-projects.controller ";
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleSchema } from './models/schedule.schema';
import { ScheduleProjectSchema } from "./models/schedule-project.schema";
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Schedule', schema: ScheduleSchema },{name:"ScheduleProject",schema:ScheduleProjectSchema}])],
  providers: [ScheduleService,ScheduleProjectService ],
  exports: [ScheduleService,ScheduleProjectService ],
  controllers: [ScheduleController,ScheduleProjectController ],
})
export class SchedulesModule {}
