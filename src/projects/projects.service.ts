import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './interface/project.interface';
import { CreateDesignDto } from './dto/create-design.dto';
import { Design } from './interface/design.interface'
import { UsersService } from "../users/users.service";
@Injectable()
export class ProjectService {
  private userService:UsersService
  constructor(@InjectModel('Project') private readonly projectModel: Model<Project>,
              @InjectModel('Design') private readonly designModel: Model<Design>
             ) {}

 
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const { employeeId,...rest }=createProjectDto
    const employee=await this.userService.find_Id(employeeId)
    const createdProject = new this.projectModel(rest);
    createdProject.employee=employee
    return await createdProject.save();
  }

  async addDesign(id:string,createDesignDto:CreateDesignDto):Promise<Project>{
    
    const project=await this.projectModel.findById(id).exec()
    const design =new this.designModel(createDesignDto);
    design.project=project
    await design.save()
    project.designs.push(design)
    return await project.save()
    
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
