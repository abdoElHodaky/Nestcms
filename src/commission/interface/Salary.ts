import { Prop, Schema } from "@nestjs/mongoose";
import  { HydratedDocument , Types} from "mongoose"
import { Employee} from "../../users/interfaces/user";
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
  @Prop()
  title: string;
  @Prop()
  amount: number;
  @Prop({type:Types.ObjectId,ref:"User"})
  employee: Employee;
  @Prop()
  payoutDate: Date;
}
