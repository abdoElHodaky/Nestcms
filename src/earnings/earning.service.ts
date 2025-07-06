import { Injectable } from '@nestjs/common';
import { Model ,Types} from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { AddEarningDto } from './dto/add-earning.dto';
import {Earning, ProjectEarning,OrgzEarning} from './interface/earning';
import { ProjectService} from "../projects/"
import { OrgzService} from "../orgs/orgzs.service"
@Injectable()
export class EarningService {
   model(type:string):any{
    if (type=="project") return this.pearnModel
    if (type=="orgz") return this.orgsearnModel
  }
  constructor(
    @InjectModel('ProjectEarning') private readonly pearnModel: Model<ProjectEarning>,
    @InjectModel('OrgzEarning') private readonly orgsearnModel: Model<OrgzEarning>
  ) {}
  private projectService:ProjectService
//  private contractService:ContractService
 
  async add(addEarningDto: AddEarningDto): Promise<Earning> {
    const {forType,addToId,...rest}=addEarningDto
    if (forType=="project")
    { const createdNote = new this.pearnModel({...rest});
      createdNote.project=await this.projectService.find_Id(addToId)
    return await createdNote.save(); }
   if (forType=="orgz"){
      const createdOrgEarn=new this.orgsearnModel({...rest})
      return  await createdOrgEarn.save()
   }
     
  }
   
  

  async find_Id(_id:string,type:string):Promise<Earning>{
    if(type=="project") return await this.pearnModel.findById(_id).exec()
  }
  
}
