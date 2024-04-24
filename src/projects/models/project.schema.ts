import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Project } from "../interface/project";

/*
export const ProjectSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  startDate: String,
  endDate:String,
  status:String,
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  designs:[{ type: mongoose.Schema.Types.ObjectId, ref:"Design"}],
  contract:{ type: mongoose.Schema.Types.ObjectId, ref: 'Contract'},
  steps:[{ type: mongoose.Schema.Types.ObjectId, ref: 'ProjectStep'}]
},{timestamps:true});*/

export const ProjectSchema = SchemaFactory.createForClass(Project,{
  timestamps:true
});
