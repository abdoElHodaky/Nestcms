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
  @Prop({
      type:String,
      enum:["seen","read"]
  })
  status:string;
  @Prop({type:Types.ObjectId,refPath:"onModel",required:true})
  onId:string;
  @Prop({type:String,
      required:true,
      enum: ['Project', 'Design']
  })
  onModel:string;
  @Prop({type:Types.ObjectId,ref:"User"})
  author?:User
}
