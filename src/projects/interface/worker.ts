import { Project } from "./project";
import {Employee} from "../../users/";
import { Prop, Schema } from "@nestjs/mongoose";
import  { HydratedDocument , Types} from "mongoose"

//export type DesignDocument = HydratedDocument<Design>


@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }, timestamps:true
})
export class Worker extends Employee  {
  @Prop()
  role:string;
  @Prop({type: Types.ObjectId,ref:"Project"})
  project?:Project;
}

