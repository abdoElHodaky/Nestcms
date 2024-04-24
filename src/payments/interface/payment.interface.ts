import { Prop, Schema } from "@nestjs/mongoose";
import mongoose , {HydratedDocument} from "mongoose"

import { Client } from "../../users/interfaces/user";
import { Contract } from "../../contracts/interface/contract";
//import _Payment from "./payment.d";

export type PaymentDocument = HydratedDocument<Payment>
    
@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
})
export class Payment {
  @Prop()
  _id:string;
  @Prop()
  title: string;
  @Prop()
  content?: string;
  @Prop()
  date: string;
  @Prop()
  status:string;
  @Prop()  
  amount:string;
  @Prop()
  currency:string
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"Contract"})
  contract?:Contract;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  client?:Client;
  @Prop()
  transR?:string

  toArrayP(){  
    return [this._id,this.amount,this.currency,this.content]
   }
  static toArrayP(arrp:Payment[]){
    let arr=arrp.map((p,i)=>{
      let v=`${p._id}`;
      return {v:[p._id,p.amount,p.currency,p.content]}
    })
    return arr
    
  }
}
