import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateNoteDto } from './dto/create-note.dto';
//import { AcceptOfferDto } from './dto/accept-offer.dto';
//import { OfferLinkToContractDto } from "./dto/link-contract.dto";
import { NoteService } from './notes.service';
import { ApiTags,ApiSecurity,ApiBearerAuth } from "@nestjs/swagger";
//import { CurrentUserInterceptor } from '../currentuser.interceptor';
//import { UpdateArticleDto } from './dto/update-article.dto';
//@UseInterceptors(CurrentUserInterceptor)
@ApiBearerAuth('JWTAuthorization')
@ApiTags("Note")
@UseGuards(AuthGuard('jwt'))
@Controller("notes")
export class NoteController {
  constructor(private readonly noteService: NoteService) {}
  @Post("create")
  async create(@Body() createNoteDto: CreateNoteDto) {
    return await this.noteService.create(createNoteDto);
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
