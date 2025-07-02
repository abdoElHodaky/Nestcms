import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Commission } from '../interface/';
//import { CreateArticleDto ,  UpdateArticleDto } from './dto/';
//import { UpdateArticleDto } from './dto/update-article.dto';

@Injectable()
export class CommissionService {
  constructor(
    @InjectModel('Commission') private readonly salaryModel: Model<Commission>,
  ) {}

 /* async create(createArticleDto: CreateArticleDto): Promise<Article> {
    const createdArticle = new this.articleModel(createArticleDto);
    return await createdArticle.save();
  }

  async findAll(): Promise<Article[]> {
    return await this.articleModel
      .find()
      .sort({ creationDate: -1 })
      .exec();
  }

  async findOne(id: string): Promise<Article> {
    return await this.articleModel.findById(id).exec();
  }
  */
 
}
