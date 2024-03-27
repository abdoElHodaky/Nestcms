import * as mongoose from 'mongoose';

export const DesignSchema = new mongoose.Schema({
  title: String,
  desc: String,
  path:String,
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
 // employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{timestamps:true});
