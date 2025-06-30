import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectLinkToContractDto } from './dto/link-contract.dto';
import { CreateProjectStepDto } from './dto/create-project-step.dto';
import { Project } from './interface/project';
import { CreateDesignDto } from './dto/create-design.dto';
import { Design } from './interface/design';
import { ProjectStep } from "./interface/project-step";
import { UsersService } from "../users/users.service";
import { ContractService } from "../contracts/contracts.service";
import { Employee } from "../users/interfaces/user";
import { Note } from "../notes/interface/note.interface";
@Injectable()
export class ProjectService {
  private userService:UsersService
  private contractService:ContractService
  constructor(@InjectModel('Project') private readonly projectModel: Model<Project>,
              @InjectModel('Design') private readonly designModel: Model<Design>,
              @InjectModel('ProjectStep') private readonly stepModel: Model<ProjectStep>,
              
             ) {}

 
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const { employeeId,...rest }=createProjectDto
    const employee=await this.userService.find_Id(employeeId)
    const createdProject = new this.projectModel({_id:new Types.ObjectId(),...rest});
    createdProject.employee=employee
    return await createdProject.save();
  }

  async addDesign(id:string,createDesignDto:CreateDesignDto):Promise<Project>{
    
    const project=await this.projectModel.findById(id).exec()
    const design =new this.designModel({_id:new Types.ObjectId(),...createDesignDto});
    design.project=project
    await design.save()
    project.designs.push(design)
    return await project.save()
    
  }
  async addStep(id:string,createProjectStepDto:CreateProjectStepDto):Promise<Project>{
    
    const project=await this.projectModel.findById(id).exec()
    const step= new this.stepModel({_id:new Types.ObjectId,...createProjectStepDto})
    project.steps.push(step)
    step.project=project
    await step.save()
    return await project.save()
  }
  
  async LinkContract(projectLinkToContractDto:ProjectLinkToContractDto):Promise<Project>{
    const {projectId,contractId}=projectLinkToContractDto
    const project=await this.projectModel.findById(projectId)
    const contract=await this.contractService.find_Id(contractId)
    project.contract=contract
    return await project.save()
  }
  async designs(projectId:string):Promise<Design[]>{
    const projectData = await this.projectModel.aggregate([
            { $match: { _id: new Types.ObjectId(projectId) } },
            {
                $lookup: {
                    from: "designs",
                    localField: "designs",
                    foreignField: "_id",
                    as: "designs",
                },
            },
        ]);
    return projectData[0].designs;
  }
  async steps(projectId:string):Promise<ProjectStep>{
    const projectData = await this.projectModel.aggregate([
            { $match: { _id: new Types.ObjectId(projectId) } },
            {
                $lookup: {
                    from: "steps",
                    localField: "steps",
                    foreignField: "_id",
                    as: "steps",
                },
            },
        ]);
    return projectData[0].steps;
  }
  async notes(projectId:string):Promise<Note>{
    const projectData = await this.projectModel.aggregate([
            { $match: { _id: new Types.ObjectId(projectId) } },
            {
                $lookup: {
                    from: "notes",
                    let:{onId:"$onId"},
                    pipeline:[
                      {
                        $match:{
                          $expr:{
                            $and:[{
                              $eq:["$onId","$$_id"]
                            },{
                              $eq:["$onModel","Project"]
                            }]
                          }
                        }
                      }
                    ],
                    as: "notes",
                },
            },
        ]);
    return projectData[0].notes;
  }
  async employees(projectId:string):Promise<Employee>{
    const project = await this.projectModel.findById(projectId).exec()
    return await this.userService.find_Id(project.employee?._id?.toString())
  }
  async find_Id(projectId:string):Promise<Project>{
    return await this.projectModel.findById(projectId)
  }
  
  async get model():Promise<any>{
    return this.projectModel
  }

  async profitTransfer(projectId:string): Promise<any> {
    const project=await this.projectModel.findById(projectId)
    const earn=Number(project.earnings) * 0.01
    project.employee.salary=earn
    project.earnings-=new BigInt(earn)
    return  await project.save()
      
  } 
  
}
