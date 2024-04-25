import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Offer } from "../interface/offer.interface";

//export type OfferDocument = HydratedDocument<Offer>

/*export const OfferSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
  price:Number,
  status:String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{timestamps:true});*/


export const OfferSchema = SchemaFactory.createForClass(Offer);
