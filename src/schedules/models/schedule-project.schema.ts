import {  SchemaFactory } from "@nestjs/mongoose";
import { ScheduleProject } from "../interface/schedule-project";
/*
export const ScheduleProjectSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  startingDate: String,
  endingDate:String,
  status:String,
  //projectsteps:[{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectStep'}],
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'}
},{timestamps:true});*/

export const ScheduleProjectSchema = SchemaFactory.createForClass(ScheduleProject,{
  timestamps:true
});

