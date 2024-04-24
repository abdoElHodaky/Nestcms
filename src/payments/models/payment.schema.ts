import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Payment } from "../interface/payment";

/*export const PaymentSchema = new mongoose.Schema({
  title: String,
  content: String,
  Date: String,
  status:String,
  amount:String,
  currency:String,
  transR:String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract'}
},{timestamps:true}); */

export const PaymentSchema = SchemaFactory.createForClass(Payment,{
  timestamps:true
});
