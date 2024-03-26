import * as mongoose from 'mongoose';

export const ContractSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
  status:String,
  path:String,
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer'},
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{timestamp:true});
