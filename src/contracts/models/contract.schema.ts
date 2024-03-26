import * as mongoose from 'mongoose';

export const ContractSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
  status:String,
  path:String,
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer'},
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{timestamp:true});
