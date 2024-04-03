import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectScheduleDto } from './dto/create-project-schedule.dto';
import { ScheduleProject } from './interface/schedule-project';
import { UsersService} from "../users/users.service";
import { ProjectService} from "../projects/projects.service"


@Injectable()
export class ScheduleProjectService {
  constructor(@InjectModel('ScheduleProject') private readonly  model:Model<ScheduleProject>) {}
  private userService:UsersService
  private projectService:ProjectService
 
  async create(createProjectScheduleDto: CreateProjectScheduleDto): Promise<ScheduleProject> {
    const {projectId,...rest}=createProjectScheduleDto
    const project=await this.projectService.find_Id(projectId)
    const createdSchedule=new this.model(rest);
    createdSchedule.project=project
    return await createdSchedule.save()
  }

  async LinkStep():Promise<ScheduleProject>{
    return
  }
  
  
}
