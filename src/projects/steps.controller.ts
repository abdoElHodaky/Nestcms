import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from "./projects.service";
import { CreateProjectStepDto } from "./dto/create-project-step.dto";
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiOperation } from "@nestjs/swagger";
@ApiBearerAuth('JWTAuthorization')
//@ApiSecurity("bearer")
@ApiTags("Project.Step")
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:id/steps')
export class StepController {
  constructor(private readonly projectService: ProjectService) {}
  
  @Post("add")
  @ApiOperation({description:" add step for specific project  "})
  async create(@Body() createProjectStepDto: CreateProjectStepDto,@Param("id") id:string) {
    return this.projectService.addStep(id,createProjectStepDto);
  }
  
  @Get("")
  @ApiOperation({description:" get steps of specific project  "})
  async findAll(@Param("id") id:string){
   return this.projectService.steps(id)
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
