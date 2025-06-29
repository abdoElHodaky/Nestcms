import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectWorkerDto } from './dto/create-project-worker.dto';
import { Project } from './interface/project';
import { ProjectWorker } from "./interface/worker";
import { UsersService } from "../users/users.service";


@Injectable()
export class ProjectWorkerService {
  private userService:UsersService
  constructor(@InjectModel('Project') private readonly projectModel: Model<Project>,
              @InjectModel('ProjectWorker') private readonly workerModel: Model<ProjectWorker>,
            
             ) {}

  async addToProject(id:string,createProjectWorkerDto:CreateProjectWorkerDto):Promise<Project>{
    
    const project=await this.projectModel.findById(id).exec()
    const worker= new this.worker({_id:new Types.ObjectId,...createProjectWorkerDto})
    project.workers.push(worker)
    worker.project=project
    await worker.save()
    return await project.save()
  }
  
  
 /* async find_Id(projectId:string):Promise<Project>{
    return await this.projectModel.findById(projectId)
  }*/
}
