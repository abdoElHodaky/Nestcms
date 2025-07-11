import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Salary } from '../interface/';

@Injectable()
export class SalaryService {
    model():any{
    return this.salaryModel
  }
  constructor(
    @InjectModel('Salary') private readonly salaryModel: Model<Salary>,
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

 /* async delete(id: string): Promise<Article> {
    return await this.articleModel.findByIdAndRemove(id);
  }
  */
  async update(id: string, _amount: number) : Promise<Salary>{
    const salary = this.salaryModel.findByIdAndUpdate({_id:id}, {
      $inc:{amount:_amount}
    }, { new: true });
    console.log(salary);
    return salary;
  }
}
