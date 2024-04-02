import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './interfaces/user.interface';

@Injectable()
export class UsersService {
  constructor(@InjectModel('User') private readonly userModel: Model<User>) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
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
}
