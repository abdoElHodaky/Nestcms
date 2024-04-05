import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Permission } from './interface/permission.interface';

@Injectable()
export class PermissionService {
  constructor(@InjectModel('Permission') private readonly permModel: Model<Permission>) {}

  async find_Id(_id: string): Promise<Permission> {
    return await this.permModel.findById(_id).exec();
  }

  async findMany_Id(_ids:string[]):Promise<Permission[]>{
    return await this.permModel.find().where('_id').in(_ids).exec()
  }
}
