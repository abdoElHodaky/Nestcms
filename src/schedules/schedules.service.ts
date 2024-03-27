import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { Schedule } from './interface/schedule.interface';
import { UsersService} from "../users/users.service"
@Injectable()
export class ScheduleService {
  constructor(@InjectModel('Schedule') private readonly scheduleModel: Model<Schedule>) {}
  private userService:UsersService
 
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const createdSchedule = new this.scheduleModel(createScheduleDto);
    const client =await this.userService.find_Id(createScheduleDto.clientId)
    const employee = await this.userService.find_Id(createScheduleDto.employeeId)
    createdSchedule.client=client 
    createdSchedule.employee=employee
    return await createdSchedule.save();
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
