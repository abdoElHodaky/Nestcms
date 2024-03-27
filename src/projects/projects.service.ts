import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './interface/project.interface';
import { CreateDesignDto } from './dto/create-design.dto';
import { Design } from './interface/design.interface'
@Injectable()
export class ProjectService {
  constructor(@InjectModel('Project') private readonly projectModel: Model<Project>,
              @InjectModel('Design') private readonly designModel: Model<Design>
             ) {}

 
  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const createdProject = new this.projectModel(createProjectDto);
    return await createdProject.save();
  }

  async addDesign(id:string,createDesignDto:CreateDesignDto):Promise<Project>{
    
    const project=await this.projectModel.findById(new Types.ObjectId(id)).exec()
    const design =new this.designModel(createDesignDto);
    design.project=project
    await design.save()
    //project.designs.push(design)
    return project
    
  }
/*
  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
