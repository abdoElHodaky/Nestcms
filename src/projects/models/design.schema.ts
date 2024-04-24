import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Design } from "../interface/design";

/*export const DesignSchema = new mongoose.Schema({
  title: String,
  desc: String,
  path:String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
 // employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{timestamps:true});*/

export const DesignSchema = SchemaFactory.createForClass(Design,{
  timestamps:true
});
