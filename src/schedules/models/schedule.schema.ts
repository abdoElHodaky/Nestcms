import {  SchemaFactory } from "@nestjs/mongoose";
import { Schedule } from "../interface/schedule";
/*export const ScheduleSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
  endingDate:String,
  status:String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});
*/
export const ScheduleSchema = SchemaFactory.createForClass(Schedule,{
  timestamps:true
});
