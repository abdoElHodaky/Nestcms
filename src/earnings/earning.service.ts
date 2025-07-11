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
  private orgzService:OrgzService
 
  async add(addEarningDto: AddEarningDto): Promise<Earning> {
    const {forType,addToId,...rest}=addEarningDto
    if (forType=="project")
    { const createdNote = new this.pearnModel({...rest});
      createdNote.project=await this.projectService.find_Id(addToId)
    return await createdNote.save(); }
   if (forType=="orgz"){
      const createdOrgEarn=new this.orgsearnModel({...rest})
      createdOrgEarn.orgz=await this.orgzService.find_Id(addToId)
      return  await createdOrgEarn.save()
   }
     
  }
   
  async collect_orgz_earn(opts:{orgzid:string,type:string,id:string|Types.ObjectId}):Promise<any>{
     const model=this.orgsearnModel
     return await  model.findByIdAndUpdate(opts.orgzid,{
        $push:{earningIds:{type:opts.type,id:opts.id}}
     },{new:true}).exec()
  }

   async compound_earnings (type:string,id:string|Types.ObjectId):Promise<any>{
    
      const _model=this.model
      const {earningIds}=await _model(type).findById(id).exec()
      //const earningIds=earning.earningIds
      const arr=await earningIds.map(async ob=>{
         const model=_model(ob.type)
         const esr=`total_earn_${ob.type}`
         const res= await model.aggregate([{
            $match:{
               id:{$in:ob.earningIds}
            }
            },{
            $group:{
               // _id:new Types.ObjectId(),
                esr:{$sum:'$amount'},
                currency:'$currency',
                period:{$sum:"$period"},
                title:esr+"for $period months"
              }
         }])
         return await {forType:ob.type,earnings:res}
         //return {type:ob.type,earnings: model.find({id:{$in:obj.ids}}).select("amount").exec()}
      })
      arr.forEach(async (el,I)=>{
        await _model(el.forType).create(el.earnings)
      })
      return 
   }

   
  async find_Id(_id:string,type:string):Promise<Earning>{
   
     return await this.model(type).findById(_id).exec()
     // if(type=="project") return await this.pearnModel.findById(_id).exec()
  //  if(type=="orgz") return await this.orgsearnModel.findById(_id).exec()
  }
  
}
