import { SchemaFactory } from "@nestjs/mongoose";
import { Permission } from "../interface/permission.interface";

/*export const PermissionSchema = new mongoose.Schema({
  type:{
    type:String,
    enum:["Approve","Read","Write","Modify"]
  },
  endDate:String,
  status:{
    type:String,
    enum:["granted","rejected","revoke"]
  },
  _by:{
      type: mongoose.Schema.Types.ObjectId,
      ref:"User"
  },
  _for:{
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
    enum: ['Project', 'ProjectSchedule',"Permission"]
  }

},{timestamps:true});*/

export const PermissionSchema = SchemaFactory.createForClass(Permission);
