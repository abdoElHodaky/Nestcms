import { SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import { Article } from "../interface/article.interface";

/*
export const ArticleSchema = new mongoose.Schema({
  title: String,
  content: String,
  author: String,
  creationDate: String,
});*/

export const ArticleSchema = SchemaFactory.createForClass(Article,{
  timestamps:true
});
