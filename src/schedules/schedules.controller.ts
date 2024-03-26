import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put } from '@nestjs/common';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ScheduleService } from './schedules.service';
import { CurrentUserInterceptor } from '../currentuser.interceptor';
//import { UpdateArticleDto } from './dto/update-article.dto';
@UseInterceptors(CurrentUserInterceptor)
@Controller('api/schedules')
export class ScheduleController {
  constructor(private readonly articlesService: ArticlesService) {}
  @Post("schedule")
  
  async createSchedule(@Body() createScheduleDto: CreateScheduleDto) {
    return this.articlesService.create(createScheduleDto);
  }
/*
  @Get()
  async findAll() {
    return this.articlesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.articlesService.findOne(id);
  }

  @Delete(':id')
  async deleteArticle(@Param('id') id: string) {
    // tslint:disable-next-line: no-console
    console.log('delete article with id -> ', id);
    return this.articlesService.delete(id);
  }*/
