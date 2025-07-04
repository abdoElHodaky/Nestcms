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
  @Prop({
      type:String,
      enum:["monthly","4-month","cumulative-quarter"]
  })
  period:string;
  @Prop()
  title:string
  @Prop()
  description:string
  @Prop()
  amount:number
  @Prop()
  currency:string
}

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }, timestamps:true
})
export class ProjectEarning extends Earning {
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
export class OrgzEarning extends Earning {
    @Prop({type:Types.ObjectId,ref:"Orgz"})
    orgz?:Orgz
}

