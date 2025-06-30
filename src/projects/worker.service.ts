import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectWorkerDto } from './dto/create-project-worker.dto';
import { Project } from './interface/project';
import { ProjectWorker } from "./interface/worker";
import { UsersService } from "../users/users.service";
import { ProjectService } from "./projects.service";

@Injectable()
export class ProjectWorkerService {
  private userService:UsersService
  private projectService: ProjectService
  
  constructor(  @InjectModel('ProjectWorker') private readonly workerModel: Model<ProjectWorker>
             ) {}

  async addTo(id:string,createProjectWorkerDto:CreateProjectWorkerDto):Promise<ProjectWorker>{
    
    const project=await this.projectService.find_Id(id)
    const worker= new this.workerModel({_id:new Types.ObjectId,...createProjectWorkerDto})
    project.workers.push(worker)
    worker.project=project
    return await worker.save()
    
  }
  
  
 /* async find_Id(projectId:string):Promise<Project>{
    return await this.projectModel.findById(projectId)
  }*/
}
