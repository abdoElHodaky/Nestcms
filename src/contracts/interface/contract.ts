//import _Contract from "./contract.d";
import { Prop, Schema } from "@nestjs/mongoose";
import mongoose , {HydratedDocument} from "mongoose"

import { Client, Employee } from "../../users/interfaces/user";
import { Offer } from "../../offers/interface/offer.interface";
import { Payment } from "../../payments/interface/payment.interface";
export type ContractDocument = HydratedDocument<Contract>

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
  _id:string;
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
  offer?:Offer;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  client?:Client;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  employee?:Employee;
  @Prop({type:{type:mongoose.Schema.Types.ObjectId,ref:"Payment"}})
  payments?:Payment[]

}
