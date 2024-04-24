//import _Contract from "./contract.d";
import { Prop, Schema } from "@nestjs/mongoose";
import mongoose , {HydratedDocument} from "mongoose"

import { ClientDocument, EmployeeDocument } from "../../users/interfaces/user";
import { OfferDocumet } from "../../offers/interface/offer.interface";
import { PaymentDocument } from "../../payments/interface/payment.interface";
export type ContractDocument = HydratedDocument<Contract>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
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
  offer?:OfferDocument;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  client?:ClientDocument;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  employee?:EmployeeDocument;
  @Prop({type:{type:mongoose.Schema.Types.ObjectId,ref:"Payment"}})
  payments?:PaymentDocument[]

}
