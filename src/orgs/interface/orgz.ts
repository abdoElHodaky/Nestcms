import { Prop, Schema } from "@nestjs/mongoose";
import  {HydratedDocument , Types } from "mongoose"
import { Address} from "../../address/interface/address";
import { User } from "../../users/interfaces/user";
import { Project } from "../../projects/";
import { OrgzEarning} from "../../earnings/interface/earning";
//export type NoteDocument = HydratedDocument<Orgz>

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
  _id: Types.ObjectId;
  @Prop({type:Object})
  address:Address
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
  @Prop({type:[{type:Types.ObjectId,ref:"Project"}]})
  projects?:Project[]
    
  @Prop()
  title:string
  @Prop()
  description:string
  @Prop({type:Types.ObjectId,ref:"User"})
  owner?:User
  @Prop({type:[{type:Types.ObjectId,ref:"OrgzEarning"}]})
  earnings?:OrgzEarning[]
  @Prop()
  profit_percentage:number=.201
}
