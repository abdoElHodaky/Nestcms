import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProjectDto } from './dto/create-project.dto';
import { Project } from './interfaces/project.interface';

@Injectable()
export class ProjectService {
  constructor(@InjectModel('Project') private readonly projectModel: Model<Project>) {}

 /* async create(createUserDto: CreateUserDto): Promise<Project> {
    const createdUser = new this.userModel(createUserDto);
    return await createdUser.save();
  }

  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  } */
}
