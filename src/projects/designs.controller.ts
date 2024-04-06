import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from "./projects.service";
import { CreateDesignDto } from "./dto/create-design.dto";
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiOperation } from "@nestjs/swagger";
@ApiBearerAuth('JWTAuthorization')
//@ApiSecurity("bearer")
@ApiTags("Project.Design")
@UseGuards(AuthGuard('jwt'))
@Controller('api/projects/:id/designs')
export class DesignController {
  constructor(private readonly projectService: ProjectService) {}
 
  @ApiOperation({description:" add designs of specific project "})
  @Post("add")
  async create(@Body() createDesignDto: CreateDesignDto,@Param("id") id:string) {
    return this.projectService.addDesign(id,createDesignDto);
  }

 
  @ApiOperation({description:" designs of specific project "})
  @Get("")
  async findAll(@Param("id") id:string){
   // return this.scheduleService.all(req.user.id);
   return this.projectService.designs(id)
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
