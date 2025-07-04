import { Prop, Schema } from "@nestjs/mongoose";
import  {HydratedDocument , Types } from "mongoose"
import { Project} from "../../projects/interface/project";
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
  @Prop()
  amount:number
}

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }, timestamps:true
})
class ProjectEarning extends Earning {
    @Prop({type:Types.ObjectId,ref:"Project"})
    project?:Project
}

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }, timestamps:true
})
class OrgzEarning extends Earning {
    @Prop({type:Types.ObjectId,ref:"Orgz"})
    orgz?:Orgz
}

