import * as mongoose from 'mongoose';

export const PaymentSchema = new mongoose.Schema({
  title: String,
  content: String,
  Date: String,
  status:String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  contract: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract'}
},{timestamps:true});
