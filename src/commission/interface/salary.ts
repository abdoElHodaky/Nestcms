import { Prop, Schema } from "@nestjs/mongoose";
import  { HydratedDocument , Types} from "mongoose"
import { Employee,Owner} from "../../users/interfaces/user";
//export type ArticleDocument = HydratedDocument<Article>


@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    },
    timestamps:true
})
export class Salary {
    
// @Prop({type:Types.ObjectId})
  //_id:Types.ObjectId|string
  @Prop()
  title: string;
  @Prop({
      type:String,
      enum:["monthly","yearly"]
  })
  periodically:string;
  @Prop()
  amount: number;
  @Prop({type:Types.ObjectId,ref:"User"})
  employee: Employee|Owner;
  @Prop()
  payoutDate: Date;
}
