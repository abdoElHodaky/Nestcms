import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateProjectScheduleDto } from './dto/create-project-schedule.dto';
import { ScheduleProjectService } from './schedules-projects.service';
import { ApiTags,ApiSecurity,ApiBearerAuth } from "@nestjs/swagger";
//import { CurrentUserInterceptor } from '../currentuser.interceptor';
//import { UpdateArticleDto } from './dto/update-article.dto';
//@UseInterceptors(CurrentUserInterceptor)
@ApiBearerAuth('JWTAuthorization')
@ApiTags("Schedule.Project")
@UseGuards(AuthGuard('jwt'))
@Controller("api/schedules/projects")
export class ScheduleProjectController {
  constructor(private readonly scheduleService: ScheduleService) {}
  @Post("create")
  async create(@Body() createScheduleProjectDto: CreateScheduleProjectDto) {
    return this.scheduleService.create(createScheduleProjectDto);
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
  }
