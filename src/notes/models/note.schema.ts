import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Note } from "../interface/note.interface";
/*export const NoteSchema = new mongoose.Schema({
  type:String,
  status:{
    type:String,
    enum:["seen","read"]
  }
  ,onId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'onModel'
  },
  onModel: {
    type: String,
    required: true,
    enum: ['Project', 'Design']
  },
  author:{ type:mongoose.Schema.Types.ObjectId,ref:"User"}

},{timestamps:true});*/

export const NoteSchema = SchemaFactory.createForClass(Note);
