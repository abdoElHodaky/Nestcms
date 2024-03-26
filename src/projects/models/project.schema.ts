import * as mongoose from 'mongoose';

export const ProjectSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  startDate: String,
  endDate:String,
  status:String,
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{timestamp:true});
