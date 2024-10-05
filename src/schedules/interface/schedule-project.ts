import { Project } from "../../projects/interface/project";
import { ProjectStep } from "../../projects/interface/project-step";
//import _ScheduleProject from"./schedule-project.d";
import { Prop, Schema } from "@nestjs/mongoose";
import  {HydratedDocument , Types } from "mongoose"
//export type ScheduleProjectDocument = HydratedDocument<ScheduleProject>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    },
    timestamps:true
})
export class ScheduleProject  {
 @Prop()
 id:string;
 @Prop()
 title: string;
 @Prop()
  content: string;
 // author: string;
 @Prop()
  startingDate: string;
 @Prop()
  endingDate:string;
 @Prop({type:String,enum:["In Progress","Finished"]})
  status:string;
 @Prop({type: Types.ObjectId,ref:"Project"})
  project?:Project;
 // projectSteps?:ProjectStep[]
  
}
