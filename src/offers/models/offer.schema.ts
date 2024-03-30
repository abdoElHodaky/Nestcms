import * as mongoose from 'mongoose';

export const OfferSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
  price:Number,
  status:String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{timestamps:true});
