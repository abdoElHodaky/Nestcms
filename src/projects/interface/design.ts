import { Project } from "./project";
//import _Design from "./design.d";
import { Prop, Schema } from "@nestjs/mongoose";
import  { HydratedDocument , Types} from "mongoose"

export type DesignDocument = HydratedDocument<Design>


@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }, timestamps:true
})
export class Design  {
  @Prop()
  _id:string;
  @Prop()
  desc:string;
  @Prop()
  path:string;
  @Prop()
  created_at?:string;
  @Prop()
  updated_at?:string;
  @Prop({type: Types.ObjectId,ref:"Project"})
  project?:Project;
}
