import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectWorkerDto } from '../dto/create-project-worker.dto';
import { Project } from '../interface/project';
import { ProjectEarning } from '../earnings/interface/earning';
import { ProjectWorker } from "../interface/worker";
import { UsersService } from "../../users/users.service";
import { ProjectService } from "./projects.service";
import { SalaryService} from "../../commission/services/salary.service" 
import { Salary } from "../../commission/interface/";
@Injectable()
export class ProjectWorkerService {
  private userService:UsersService
  private projectService: ProjectService
  private salaryServ:SalaryService 
  constructor(  @InjectModel('ProjectWorker') private readonly workerModel: Model<ProjectWorker>,
                 @InjectModel('ProjectEarning') private readonly pearnModel: Model<ProjectEarning>,
                 @InjectModel('Salary') private readonly salaryModel: Model<Salary>
          
             ) {}

  async addTo(id:string,createProjectWorkerDto:CreateProjectWorkerDto):Promise<ProjectWorker>{
    
    const project=await this.projectService.find_Id(id)
    const worker=this.workerModel.create({...createProjectWorkerDto})
    project.workers.push(worker)
    worker.project=project
    return await worker.save()
    
  }
  
  async profitTransfer(opts:{projectId:string,workerId:string,earnId:string}): Promise<ProjectWorker> {
    let project=await this.projectService.find_Id(opts.projectId)
    let earnings=await this.pearnModel.findById(opts.earnId).exec()
    const worker= await this.workerModel.findById(opts.workerId).exec()
    const earn=earnings.amount * 0.01
    earnings.amount-=earn
    await earnings.save()
    //project=await this.projectService.update_earnings(project._id.toString(),earn);
    let salary=worker.salaries.pop()
    salary=await this.salaryServ.update(salary?.id,earn)
    return worker
  } 
  
   async  distribute_earn(projectId:string,earnId:string):Promise<void>{
    let earnings=await this.pearnModel.findById(earnId).exec()
    const sm=this.salaryModel
    this.workerModel.find({
      project:{id:projectId}
    }).select("workers - id").then(ids=>{
      return sm.find({worker:{id:ids}})
    }).then(salaries=>{
      const sal=salaries.pop()
      sal.amount+=earnings.amount * 0.01
      sal.save()
    }).catch(console.log)
     
  }
}
