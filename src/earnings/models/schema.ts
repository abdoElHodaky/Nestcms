import { SchemaFactory } from "@nestjs/mongoose";
//import { HydratedDocument } from "mongoose";
import { Earning,OrgzEarning,ProjectEarning } from "../interface/earning";


export const EarningSchema = SchemaFactory.createForClass(Earning);
export const ProjectEarningSchema = SchemaFactory.createForClass(ProjectEarning);
export const OrgzEarningSchema = SchemaFactory.createForClass(OrgzEarning);
