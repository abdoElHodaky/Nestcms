import { Prop, Schema } from "@nestjs/mongoose";
import  {HydratedDocument , Types } from "mongoose"
import { Address} from "../../address/interface/address";
import { Orgz } from "../../orgs/interface/orgz";
//export type NoteDocument = HydratedDocument<Orgz>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }, timestamps:true
})
export class Earning {
  @Prop()
  _id: Types.ObjectId;
  @Prop({
      type:String,
      enum:["profit","loss"]
  })
  type:string;
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
  @Prop({type:Types.ObjectId,ref:"Orgz"})
  orgz?:Orgz
  @Prop()
  amount:number
}
