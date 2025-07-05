import { SchemaFactory } from "@nestjs/mongoose";
import mongoose, { HydratedDocument } from "mongoose";
import { User } from "../interfaces/user";


export const UserSchema = SchemaFactory.createForClass(User);
