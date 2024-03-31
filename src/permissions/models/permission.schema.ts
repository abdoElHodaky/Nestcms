import * as mongoose from 'mongoose';

export const PermissionSchema = new mongoose.Schema({
  on: {
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
