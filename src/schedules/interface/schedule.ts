import { Employee ,Client } from "../../users/interfaces/user";
//import _Schedule from "./schedule.d"
import { Prop, Schema } from "@nestjs/mongoose";
import  {HydratedDocument , Types } from "mongoose"
export type ScheduleDocument = HydratedDocument<Schedule>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    },
    timestamps:true
})
export class Schedule{
 @Prop()
 _id:string;
 @Prop()
 title: string;
 @Prop()
  content: string;
 @Prop()
  //author: string;
  creationDate: string;
 @Prop()
  endingDate:string;
 @Prop({type:String,enum:["In progress","Finished"]})
  status:string;
 @Prop()
  client?:Client;
 @Prop()
  employee?:Employee;
}
