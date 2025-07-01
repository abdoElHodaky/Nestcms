import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Commission , Salary } from "../interface/";

export const CommissionSchema = SchemaFactory.createForClass(Commission)
export const SalarySchema = SchemaFactory.createForClass(Salary);
