import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { User,UserDocument } from './interfaces/user';
import { Project } from "../projects/interface/project";
@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(userType:string,createUserDto: CreateUserDto): Promise<User> {
   // let cudto=createUserDto
    let createdUser;
    switch (userType){
      case "Employee":
        let cemdto:CreateEmployeeDto=createUserDto
         cemdto.isEmployee=true
         cemdto.employeeType=createUserDto.employeeType
         createdUser=new this.userModel(cemdto)
        
        break;
      case "Client":
        let cudto:CreateClientDto=createUserDto;
        cudto.isEmployee=false
        cudto.employeeType=""
        createdUser=new this.userModel(cudto)
        break;
      default:
        break
    }
    //const createdUser = new this.userModel(cutdo);
    return await createdUser.save();
  }

  async findOne(email: string): Promise<UserDocument> {
    return await this.userModel.findOne({ email }, '-__v').exec();
  }

  async find_Id(_id: string): Promise<UserDocument> {
    let user=await this.userModel.findById(_id).exec();
     return user 

  }

  async findMany_Id(_ids:string[]):Promise<UserDocument[]>{
    let users=await this.userModel.find().where('_id').in(_ids).exec()
    return users
  }
  async my_Permissions(_id:string):Promise<UserDocument>{
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
    return userData[0]
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
