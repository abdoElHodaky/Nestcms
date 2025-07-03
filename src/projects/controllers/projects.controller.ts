import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from "../services/projects.service";
import { CreateProjectDto } from "../dto/create-project.dto";
import { ProjectLinkToContractDto } from "../dto/link-contract.dto";
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiOperation } from "@nestjs/swagger";
@ApiBearerAuth('JWTAuthorization')
@ApiTags("P")
@UseGuards(AuthGuard('jwt'))
@Controller('projects')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}
 
  @Post("")
  @ApiOperation({description:" add project  "})
  async create(@Body() createProjectDto: CreateProjectDto) {
   return this.projectService.create(createProjectDto);
   
  }

  @Get("")
  @ApiOperation({description:" get projects of specific employee  "})
  async findAll(@Request() req){
   // return this.scheduleService.all(req.user.id);
    return
  }
  
  @Post("contract")
  @ApiOperation({description:" link project to contract "})
  async link_contract(@Body() projectLinkToContractDto:ProjectLinkToContractDto){
    return this.projectService.LinkContract(projectLinkToContractDto)
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
