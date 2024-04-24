import { Project } from "./project";
//import { Contract } from "../contracts/contract.interface";
//import _ProjectStep from "./project-step.d";
import { Prop, Schema } from "@nestjs/mongoose";
import  { HydratedDocument , Types} from "mongoose"

export type ProjectStepDocument = HydratedDocument<ProjectStep>


@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
})
export class ProjectStep  {
  @Prop()
  _id: string;
  @Prop()
  startDate:string;
  @Prop()
  endDate:string;
  @Prop()
  content:string;
  @Prop()
  status:string;
  @Prop({type: Types.ObjectId, ref:"Project"})
  project?:Project
}
