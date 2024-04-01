import * as mongoose from 'mongoose';

export const ProjectStepSchema = new mongoose.Schema({
  title: String,
  content: String,
  startDate: String,
  endDate:String,
  status:String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  scheduleproject:{ type: mongoose.Schema.Types.ObjectId, ref:"ScheduleProject"},
},{timestamps:true});
