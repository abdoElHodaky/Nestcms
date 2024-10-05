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
    }, timestamps:true
})
export class Note {
  @Prop()
  _id:Types.ObjectId;
  @Prop({
      type:String,
      enum:["seen","read"]
  })
  status:string;
  @Prop({type:Types.ObjectId,refPath:"onModel",required:true})
  onId:string;
  @Prop({type:String,
      required:true,
      enum: ['Project', 'Design','Schedule']
  })
  onModel:string;
  @Prop({type:Types.ObjectId,ref:"User"})
  author?:User
}
