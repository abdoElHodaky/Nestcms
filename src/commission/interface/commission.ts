//import _Contract from "./contract.d";
import { Prop, Schema } from "@nestjs/mongoose";
import mongoose , {HydratedDocument,Types} from "mongoose"

import { Employee } from "../../users/";
import {Project} from "../../projects/";

//export type ContractDocument = HydratedDocument<Contract>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    },timestamps:true
})
export class Commission {
  @Prop()
  _id:Types.ObjectId;
  @Prop()
  title: string;
  @Prop()
  percentage: number;
  @Prop()
  status:string;
  
 // @Prop({type:mongoose.Schema.Types.ObjectId,ref:"Offer"})
 // offerId?:Types.ObjectId;
 // @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
 // client?:Client;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  employeeId?:Types.ObjectId|string;
  @Prop({type:{type:mongoose.Schema.Types.ObjectId,ref:"Project"}})
  ProjectId?: Types.ObjectId|string

}
