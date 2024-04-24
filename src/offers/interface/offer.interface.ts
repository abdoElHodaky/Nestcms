import { Prop, Schema } from "@nestjs/mongoose";
import mongoose from "mongoose"
import { Client,Employee } from "../../users/interfaces/user";
import { Contract } from "../../contracts/interface/contract";

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
})
export class Offer {
  @Prop()
  _id:string;
  @Prop()
  title: string;
  @Prop()
  content: string;
  @Prop()
  creationDate: string;
  @Prop()
  endDate:string;
  @Prop()
  status:string;
  @Prop()
  price:string;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"Contract"})
  contract?:Contract;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  client?:Client;
  @Prop({type:mongoose.Schema.Types.ObjectId,ref:"User"})
  employee?:Employee;
}
