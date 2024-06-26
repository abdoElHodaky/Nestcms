import { Prop, Schema } from "@nestjs/mongoose";
import {Types ,HydratedDocument } from "mongoose";

import { Admin , User } from "../../users/interfaces/user";
export type PermissionDocument = HydratedDocument<Permission>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    },timestamps:true
})
export class Permission {
  @Prop()
  _id:string;
  @Prop({
      type:String,
      enum:["Approve","Read","Write","Modify"]
  })
  type:string;
  @Prop()
  status:string
  @Prop({type: Types.ObjectId,ref:"User" })
  _by:Admin
  @Prop({type: Types.ObjectId,ref:"User" })
  _for:User
  @Prop({type: Types.ObjectId,
       required: true,
       refPath: 'onModel'
  })
  onId:string;
  @Prop({
      type: String,
    required: true,
    enum: ['Project', 'ProjectSchedule',"Permission"]
  
  })
  onModel:string

}
  
