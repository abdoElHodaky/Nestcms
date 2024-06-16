import { Prop, Schema } from "@nestjs/mongoose";
import  {HydratedDocument , Types } from "mongoose"

import { User } from "../../users/interfaces/user";
export type NoteDocument = HydratedDocument<Orgz>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }, timestamps:true
})
export class Orgz {
  @Prop()
  _id:string;
  @Prop()
  address:{
    city:string,
    street:string,
    postalCode:string,
    country:string
  }
  @Prop({
      type:String,
      enum:["open","closed"]
  })
  status:string;
 /* @Prop({type:Types.ObjectId,refPath:"onModel",required:true})
  onId:string;
  @Prop({type:String,
      required:true,
      enum: ['Project', 'Design','Schedule']
  })*/
  //onModel:string;
  @Prop()
  title:string
  @Prop()
  description:string
  @Prop({type:Types.ObjectId,ref:"User"})
  owner?:User
}
