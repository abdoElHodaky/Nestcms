
import { Prop, Schema } from "@nestjs/mongoose";
import  { HydratedDocument , Types} from "mongoose"

export type ArticleDocument = HydratedDocument<Article>


@Schema({
    toJSON:{
        versionKey: false,
    },
    toObject:{
        versionKey: false,
    }
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
