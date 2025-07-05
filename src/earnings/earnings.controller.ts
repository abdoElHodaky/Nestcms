import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AddEarningDto } from './dto/add-earning.dto';
import { EarningService } from './earning.service';
import { ApiTags,ApiSecurity,ApiBearerAuth } from "@nestjs/swagger";
//@UseInterceptors(CurrentUserInterceptor)
@ApiBearerAuth('JWTAuthorization')
@ApiTags("Earning")
@UseGuards(AuthGuard('jwt'))
@Controller("earnings")
export class EarningController {
  constructor(private readonly earnService: EarningService) {}
  @Post("add")
  async add(@Body() addEarningDto: AddEarningDto) {
    return await this.earnService.add(addEarningDto);
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
