import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Orgz } from "../interface/orgz";


export const NoteSchema = SchemaFactory.createForClass(Orgz);
