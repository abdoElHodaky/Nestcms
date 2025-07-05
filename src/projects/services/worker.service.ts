import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectWorkerDto } from '../dto/create-project-worker.dto';
import { Project } from '../interface/project';
import { ProjectEarning,EarningService } from '../../earnings/';
import { ProjectWorker } from "../interface/worker";
//import { UsersService } from "../../users/users.service";
import { ProjectService } from "./projects.service";
import { SalaryService,Salary} from "../../commission/" 


@Injectable()
export class ProjectWorkerService {
  private earnService:EarningService
  private projectService: ProjectService
  private salaryServ:SalaryService 
  //private pearnModel:Model<ProjectEarning>
  //private salaryModel:Model<Salary>
  constructor(@InjectModel("ProjectWorker") private readonly workerModel: Model<ProjectWorker>,
              ) {
               this.salaryModel=this.salaryServ.model()
               this.pearnModel=this.earnService.model("project")
             
             }

  async addTo(id:string,createProjectWorkerDto:CreateProjectWorkerDto):Promise<ProjectWorker>{
    
    const project=await this.projectService.find_Id(id)
    const worker=new this.workerModel({...createProjectWorkerDto})
    project.workers.push(worker)
    worker.project=project
    return await worker.save()
    
  }
  
  async profitTransfer(opts:{projectId:string,workerId:string,earnId:string}): Promise<ProjectWorker> {
    let project=await this.projectService.find_Id(opts.projectId)
    const pearnModel=this.earnService.model("project")
    let earnings=await pearnModel.findById(opts.earnId).exec()
    const worker= await this.workerModel.findById(opts.workerId).exec()
    const earn=earnings.amount * 0.01
    earnings.amount-=earn
    await earnings.save()
    //project=await this.projectService.update_earnings(project._id.toString(),earn);
    let salary=worker.salaries.pop()
    salary=await this.salaryServ.update(salary["id"],earn)
    return worker
  } 
  
   async  distribute_earn(projectId:string,earnId:string):Promise<void>{
    let earning=await this.pearnModel.findById(earnId).exec()
    const sm=this.salaryServ.model()
    const pearn=this.earnService.model("project")
    const earn =earning.amount * 0.01
    this.workerModel.find({
      project:{id:projectId}
    }).select("workers - id").then( ids=>{
      return  sm.find({worker:{id:ids}})
    }).then(salaries=>{
      const sal=salaries.pop()
      sm.findByIdAndUpdate(sal["id"],{
        $inc:{$amount:earn}
      },{new:true}).exec()
      pearn.findByIdAndUpdate(earning["id"],{
        $dec:{$amount:earn}
      },{new:true}).exec()
      
    }).catch(console.log)
     
  }
}
