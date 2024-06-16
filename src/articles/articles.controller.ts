import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateArticleDto } from './dto/create-article.dto';
import { ArticlesService } from './articles.service';
import { CheckauthorInterceptor } from '../checkauthor.interceptor';
import { UpdateArticleDto } from './dto/update-article.dto';
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiOperation } from "@nestjs/swagger";


@ApiBearerAuth('JWTAuthorization')
@ApiTags("Article")
@Controller('api/articles')
export class ArticlesController {
  constructor(private readonly articlesService: ArticlesService) {}
 
  @Post()
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(CheckauthorInterceptor)
  async createArticle(@Body() createArticleDto: CreateArticleDto) {
    return this.articlesService.create(createArticleDto);
  }

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
    return 
   // return this.articlesService.delete(id);
  }

  @Put(':id')
  async updateArticle(@Param('id') id: string, @Body() article: UpdateArticleDto) {
    return this.articlesService.update(id, article);
  }
}
