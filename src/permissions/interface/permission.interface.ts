import { Prop, Schema } from "@nestjs/mongoose";
import {Types ,HydratedDocument } from "mongoose";

import { Admin , User } from "../users/interfaces/user";
export type PermissionDocument = HydratedDocument<Permission>

@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
})
export class Permission {
  @Prop()
  _id:string;
  @Prop()
  type:string;
  @Prop()
  status:string
  @Prop()
  _by:Admin
  @Prop()
  _for:User
  @Prop()
  onId:string;
  @Prop()
  onModel:string

}
  
