import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectWorkerService } from "../services/worker.service";
import { CreateProjectWorkerDto } from "../dto/create-project-worker.dto";
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiOperation } from "@nestjs/swagger";
@ApiBearerAuth('JWTAuthorization')
//@ApiSecurity("bearer")
@ApiTags("P.Worker")
@UseGuards(AuthGuard('jwt'))
@Controller('projects/:id/workers')
export class WorkerController {
  constructor(private readonly workerService: ProjectWorkerService) {}
  
  @Post("add")
  @ApiOperation({description:" add worker for specific project  "})
  async create(@Body() createProjectWorkerDto: CreateProjectWorkerDto,@Param("id") id:string) {
    return this.workerService.addTo(id,createProjectWorkerDto);
  }
  
  @Get("")
  @ApiOperation({description:" get steps of specific project  "})
  async findAll(@Param("id") id:string){
   return ""
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

