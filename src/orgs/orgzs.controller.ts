import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateOrgzDto } from './dto/create-orgz.dto';
import { OrgzService } from './orgzs.service';
import { ApiTags,ApiSecurity,ApiBearerAuth } from "@nestjs/swagger";

@ApiBearerAuth('JWTAuthorization')
@ApiTags("Orgz")

@Controller(["orgzs","api/orgzs"])
export class OrgzController {
  constructor(private readonly orgzService: OrgzService) {}
  
  @Get("")
  async all(){
     return await this.orgzService.all()
  }


  @UseGuards(AuthGuard('jwt'))
  @Post("")
  async create(@Body() createOrzDto: CreateOrgzDto) {
    return //await this.noteService.create(createNoteDto);
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
