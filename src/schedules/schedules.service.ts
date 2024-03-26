import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { Schedule } from './interface/schedule.interface';

@Injectable()
export class ScheduleService {
  constructor(@InjectModel('Schedule') private readonly scheduleModel: Model<Schedule>) {}

 
  async create(createScheduleDto: CreateScheduleDto): Promise<Project> {
    const createdSchedule = new this.scheduleModel(createScheduleDto);
    return await createdSchedule.save();
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
