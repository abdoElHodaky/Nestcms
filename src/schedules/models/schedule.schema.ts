import * as mongoose from 'mongoose';

export const ScheduleSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
  endingDate:String,
  status:String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
});
