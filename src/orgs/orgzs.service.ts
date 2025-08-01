import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateOrgzDto } from './dto/create-orgz.dto';
import { Orgz } from './interface/orgz';
import { UsersService} from "../users/"

@Injectable()
export class OrgzService {
  constructor(@InjectModel('Orgz') private readonly orgzModel: Model<Orgz>) {}
  private userService:UsersService
 // private contractService:ContractService
 
  async create(orgzcDto: CreateOrgzDto): Promise<Orgz> {
    const {ownerId,...rest}=orgzcDto
    const owner=await this.userService.find_Id(ownerId)
    const createdOrgz = new this.orgzModel({...rest});
    createdOrgz.owner=owner
    return await createdOrgz.save();
  }
  
/*  async employee_all(uid:string):Promise<Offer[]>{
    const employee = await this.userService.find_Id(uid)
    return await this.offerModel.find().populate({
      path:"employee",
      match:{"employee._id":employee._id},
    }).exec();
  }*/
  async find_Id(_id:string):Promise<Orgz>{
    return await this.orgzModel.findById(_id).exec()
  }
  
  async all(ownerId?:string): Promise<Orgz[]> {
    return await this.orgzModel.find({
      owner:(ownerId !=undefined)?{_id:ownerId}:{}
    }).exec();
  } 
}
