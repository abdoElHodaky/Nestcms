import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { PermGuard } from "../perm.guard";
import { Permissions } from "../permissions/permissions-models.decorator";
import { Perms , OnModel } from '../permissions/permissions-models.enum';

import { CreateScheduleDto } from './dto/create-schedule.dto';
import { ScheduleService } from './schedules.service';
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiOperation } from "@nestjs/swagger";
//import { CurrentUserInterceptor } from '../currentuser.interceptor';
//import { UpdateArticleDto } from './dto/update-article.dto';
//@UseInterceptors(CurrentUserInterceptor)
@ApiBearerAuth('JWTAuthorization')
@ApiTags("Schedule")
@UseGuards(AuthGuard('jwt')) 
@Controller("schedules")
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}
  
  @Permissions({perms:[Perms.WRITE],models:[OnModel.SCHEDULE]})
  @UseGuards(PermGuard)
  @Post("create")
  @ApiOperation({description:"create schedule for specific client"})
  async create(@Body() createScheduleDto: CreateScheduleDto) {
    return this.scheduleService.create(createScheduleDto);
  }
  
  @Get("")
  @ApiOperation({description:"get all schedules of specific user"})
  async findAll(@Request() req){
    return this.scheduleService.all(req.user.id);
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
