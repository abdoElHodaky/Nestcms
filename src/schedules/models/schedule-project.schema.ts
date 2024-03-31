import * as mongoose from 'mongoose';

export const ScheduleProjectSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
  endingDate:String,
  status:String,
  projectsteps:[{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectStep'}]
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});
