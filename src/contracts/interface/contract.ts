//import _Contract from "./contract.d";
import { Prop, Schema } from "@nestjs/mongoose";
import mongoose , {HydratedDocument,Types} from "mongoose"

import { Client, Employee } from "../../users/";
import {Offer} from "../../offers";
import {Payment} from "../../payments";

//export type ContractDocument = HydratedDocument<Contract>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    },timestamps:true
})
export class Contract {
  @Prop()
  id:string;
  @Prop()
  title: string;
  @Prop()
  content: string;
  @Prop()
 // author: string;
  @Prop()
  creationDate: string;
  @Prop()
  status:string;
  @Prop()
  path:string;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"Offer"})
  offerId?:Types.ObjectId;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  client?:Client;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  employee?:Employee;
  @Prop({type:{type:mongoose.Schema.Types.ObjectId,ref:"Payment"}})
  paymentsIds?: Types.ObjectId[]

}
