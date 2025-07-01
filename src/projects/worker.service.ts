import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectWorkerDto } from './dto/create-project-worker.dto';
import { Project } from './interface/project';
//import { Salary } from '../commission/interface/';
import { ProjectWorker } from "./interface/worker";
import { UsersService } from "../users/users.service";
import { ProjectService } from "./projects.service";

@Injectable()
export class ProjectWorkerService {
  private userService:UsersService
  private projectService: ProjectService
  
  constructor(  @InjectModel('ProjectWorker') private readonly workerModel: Model<ProjectWorker>,
              //   @InjectModel('Salary') private readonly salaryModel: Model<Salary>
                
             ) {}

  async addTo(id:string,createProjectWorkerDto:CreateProjectWorkerDto):Promise<ProjectWorker>{
    
    const project=await this.projectService.find_Id(id)
    const worker= new this.workerModel({_id:new Types.ObjectId,...createProjectWorkerDto})
    project.workers.push(worker)
    worker.project=project
    return await worker.save()
    
  }
  
  async profitTransfer(projectId:string,workerId:string): Promise<Project> {
    let project=await this.projectService.find_Id(projectId)
    const earn=project.earnings * 0.01
    project=await this.projectService.update_Id(project._id,{
      earnings:project.earnings-earn
    });
    
    
    return  project
      
  } 
  
 /* async find_Id(projectId:string):Promise<Project>{
    return await this.projectModel.findById(projectId)
  }*/
}
