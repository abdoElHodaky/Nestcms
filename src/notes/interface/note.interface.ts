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
  @Prop()
  status:string;
  @Prop()
  onId:string;
  @Prop()
  onType:string;
  @Prop()
  author?:User
}
