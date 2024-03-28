import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from "./projects.service";
import { CreateDesignDto } from "./dto/create-design.dto";
import { ApiTag } from "@nestjs/swagger";
@ApiTag("Project.Design")
@UseGuards(AuthGuard('jwt'))
@Controller(['api','projects/:id','designs'])
export class DesignController {
  constructor(private readonly projectService: ProjectService) {}
  @Post("add")
  async create(@Body() createDesignDto: CreateDesignDto,@Param("id") id:string) {
    return this.projectService.addDesign(id,createDesignDto);
  }
  
  @Get("")
  async findAll(@Param("id") id:string){
   // return this.scheduleService.all(req.user.id);
   return id
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
