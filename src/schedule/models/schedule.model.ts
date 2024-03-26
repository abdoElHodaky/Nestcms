import * as mongoose from 'mongoose';

export const ScheduleSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
  endingDate:String,
  
});
