import * as mongoose from 'mongoose';

export const ProjectStepSchema = new mongoose.Schema({
  title: String,
  content: String,
  startDate: String,
  endDate:String,
  status:String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  schedule:{ type: mongoose.Schema.Types.ObjectId, ref:"ScheduleProject"},
},{timestamps:true});
