import * as mongoose from 'mongoose';

export const NoteSchema = new mongoose.Schema({
  type:String,
  status:{
    type:String,
    enum:["seen","read"]
  }
  ,on: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    required: true,
    enum: ['Project', 'Design']
  },
  author:{ type:mongoose.Schema.Types.ObjectId,ref:"User"}

},{timestamps:true});
