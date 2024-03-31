import * as mongoose from 'mongoose';

export const PermissionSchema = new mongoose.Schema({
  type:string,
  status:{
    type:string,
    enum:["granted","rejected","revoke"]
  },
  granted_by:{
      type: mongoose.Schema.Types.ObjectId,
      ref:"User"
  }
  ,on: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    required: true,
    enum: ['Project', 'ProjectSchedule']
  }

},{timestamps:true});
