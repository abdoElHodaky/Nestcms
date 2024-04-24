import { Injectable } from '@nestjs/common';
import { Model,Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Permission } from './permission.interface';
import { CreatePermissionDto } from "./dto/create-permission.dto";
@Injectable()
export class PermissionService {
  constructor(@InjectModel('Permission') private readonly permModel: Model<Permission>) {}

  async create(createPermission :CreatePermissionDto):Promise<Permission|void>{
    let perm=new this.permModel(createPermission)
    return await perm.save()
  }
  async find_Id(_id: string): Promise<Permission> {
    return await this.permModel.findById(_id).exec();
  }

  async findMany_Id(_ids:string[]):Promise<Permission[]>{
    return await this.permModel.find().where('_id').in(_ids).exec()
  }
  async grant(_id:string,userId:string):Promise<Permsission>{
    let perm= await this.permModel.findById(_id).exec()
    perm._for=new Types.ObjectId(userId)
    perm.status="granted"
    return await perm.save()
    
  }
  

/*  async findModel_forUId(model:string,uid:string):Promise<Permission>{
     return await this.permModel.find({onModel:model,for:uid}).exec()
  } */
}
