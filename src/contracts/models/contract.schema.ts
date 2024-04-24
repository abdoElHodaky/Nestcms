import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Contract } from "../interface/contract";

export type ContractDocument = HydratedDocument<Contract>

/*export const ContractSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
  status:String,
  path:String,
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer'},
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  payments: [{ type :mongoose.Schema.Types.ObjectId, ref :"Payment" }]
},{timestamps:true});*/

export const ContractSchema = SchemaFactory.createForClass(Contract,{
  timestamps:true
});

