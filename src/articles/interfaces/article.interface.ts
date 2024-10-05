import { Prop, Schema } from "@nestjs/mongoose";
import  { HydratedDocument , Types} from "mongoose"
import { User } from "../../users/interfaces/user";
export type ArticleDocument = HydratedDocument<Article>


@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    },
    timestamps:true
})
export class Article {
  @Prop()
  title: string;
  @Prop()
  content: string;
  @Prop({type:Types.ObjectId,ref:"User"})
  author: User;
  @Prop()
  creationDate: string;
}
