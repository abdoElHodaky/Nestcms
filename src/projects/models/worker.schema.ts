
import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { ProjectWorker } from "../interface/worker";

export const ProjectWorkerSchema = SchemaFactory.createForClass(ProjectWorker);
