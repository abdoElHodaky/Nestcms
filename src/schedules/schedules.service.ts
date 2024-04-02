import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { Schedule } from './interface/schedule';
import { UsersService} from "../users/users.service";
import { ProjectService} from "../projects/projects.service"


@Injectable()
export class ScheduleService {
  constructor(@InjectModel('Schedule') private readonly scheduleModel: Model<Schedule>) {}
  private userService:UsersService
  private projectService:ProjectService
 
  async create(createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    const {clientId,employeeId,...rest}=createScheduleDto
    const [client,employee]=await this.userService.findMany_Id([clientId,employeeId])
    //const employee = await this.userService.find_Id(createScheduleDto.employeeId)
    const createdSchedule = new this.scheduleModel(rest);
    createdSchedule.client=client;
    createdSchedule.employee=employee;
    return await createdSchedule.save();
  }
  async all(uid:string):Promise<Schedule[]>{
    const employee = await this.userService.find_Id(uid)
    return await this.scheduleModel.find().populate([
    {
      path:"client",
    },
    {
      path:"employee",
      match:{"employee._id":employee._id},
    }
    ]).exec();
  }
 /* async linkProject(scheduleId,projectId:string):Promise<Schedule>{
    const project=await this.projectService.find_Id(projectId)
    const schedule=await this.scheduleModel.findById(scheduleId)
    schedule.project=project
    //project.schedule=schedule
    //await project.save()
    await schedule.save()
    return schedule
  }*/
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
