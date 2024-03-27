import * as mongoose from 'mongoose';

export const ProjectSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  startDate: String,
  endDate:String,
  status:String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  designs:[{ type: mongoose.Schema.Types.ObjectId}, ref:"Design"],
});
