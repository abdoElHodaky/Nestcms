import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectWorkerDto } from '../dto/create-project-worker.dto';
import { Project } from '../interface/project';
//import { Salary } from '../commission/interface/';
import { ProjectWorker } from "../interface/worker";
import { UsersService } from "../../users/users.service";
import { ProjectService } from "./projects.service";
import { SalaryService} from "../../commission/services/salary.service" 
@Injectable()
export class ProjectWorkerService {
  private userService:UsersService
  private projectService: ProjectService
  private salaryServ:SalaryService 
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
  
  async profitTransfer(projectId:string,workerId:string): Promise<ProjectWorker> {
    let project=await this.projectService.find_Id(projectId)
    const worker= await this.workerModel.findById(workerId).exec()
    const earn=project.earnings * 0.01
    project=await this.projectService.update_earnings(project._id.toString(),earn);
    let salary=worker.salaries.pop()
    salary=await this.salaryServ.update(salary._id?.toString(),earn)
    return worker
  } 
  
 /* async find_Id(projectId:string):Promise<Project>{
    return await this.projectModel.findById(projectId)
  }*/
}
