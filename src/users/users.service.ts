import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { User } from './interfaces/user';
import { Project } from "../projects/interface/project";
@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(userType:string,createUserDto: CreateUserDto): Promise<User> {
    let cudto=createUserDto
    switch (userType){
      case "Employee":
        cutdo=<CreateEmplyeeDto>{...cutdto};
        break;
      case "Client":
        cutdto=<CreateClientDto>{...cudto}
        break;
      default:
        break
    }
    const createdUser = new this.userModel(cutdo);
    return await createdUser.save();
  }

  async findOne(email: string): Promise<User> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  }

  async find_Id(_id: string): Promise<User> {
    return await this.userModel.findById(_id).exec();
  }

  async findMany_Id(_ids:string[]):Promise<User[]>{
    return await this.userModel.find().where('_id').in(_ids).exec()
  }
  async my_Permissions(_id:string):Promise<User[]>{
    /*return await this.userModel.findById(_id).populate([
      {
        path:"permissions"
      }
    ]).exec()*/
    const userData = await this.userModel.aggregate([
            { $match: { _id: new Types.ObjectId(_id) } },
            {
                $lookup: {
                    from: "permissions",
                    localField: "permissions",
                    foreignField: "for",
                    as: "permissions_have",
                },
            },
        ]);
    return userData
  }
  async my_Projects(uid:string):Promise<Project[]>{
    const userData = await this.userModel.aggregate([
            { $match: { _id: new Types.ObjectId(uid) } },
            {
                $lookup: {
                    from: "projects",
                    localField: "_id",
                    foreignField: "employee",
                    as: "projects",
                },
            },
        ]);
    return userData[0].projects;
  }

}
