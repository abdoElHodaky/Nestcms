import { Prop, Schema } from "@nestjs/mongoose";
import  {HydratedDocument , Types } from "mongoose"

import { User } from "../../users/interfaces/user";
export type NoteDocument = HydratedDocument<Note>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
})
export class Note {
  @Prop()
  _id:string;
  @Prop({type:{
      type:String,
      enum:["seen","read"]
  }})
  status:string;
  @Prop({type:Types.ObjectId,refPath:"onType",required:true})
  onId:string;
  @Prop({type:{
      type:String,
      required:true,
      enum: ['Project', 'Design']
  }})
  onType:string;
  @Prop({type:Types.ObjectId,ref:"User"})
  author?:User
}
