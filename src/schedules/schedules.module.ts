import { Module } from '@nestjs/common';
import { ScheduleService } from './schedules.service';
import { ScheduleController } from './schedules.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleSchema } from './models/schedule.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: 'Schedule', schema: ScheduleSchema }])],
  providers: [ScheduleService],
  exports: [ScheduleService],
  controllers: [ScheduleController],
})
export class SchedulesModule {}
