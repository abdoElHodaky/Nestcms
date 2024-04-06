
import { Controller, Post, Body, Get, Delete, Param, UseInterceptors, Put,UseGuards,Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectService } from "./projects.service";
import { NoteService } from "../notes/notes.service";
import { CreateNoteDto } from "../notes/dto/create-note.dto";
import { ApiTags,ApiSecurity,ApiBearerAuth,ApiOperation } from "@nestjs/swagger";
@ApiBearerAuth('JWTAuthorization')
//@ApiSecurity("bearer")
@ApiTags("Project.Note")
@UseGuards(AuthGuard('jwt'))
@Controller('api/projects/:id/notes')
export class NoteController {
  private noteService:NoteService;
  constructor(private readonly projectService: ProjectService) {}
  
  @Post("add")
  @ApiOperation({description:" add note for specific project "})
  async create(@Body() createNoteDto: CreateNoteDto) {
    return this.noteService.create(createNoteDto);
  }
  
  @Get("")
  @ApiOperation({description:" get notes of specific project "})
  async findAll(@Param("id") id:string){
   // return this.scheduleService.all(req.user.id);
   return this.projectService.notes(id)
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
