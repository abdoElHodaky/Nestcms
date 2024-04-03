import { Module } from '@nestjs/common';
import { NoteService } from './note.service';
import { NoteController } from './note.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { NoteSchema } from './models/note.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Note', schema: NoteSchema }])],
  providers: [NoteService],
  exports: [NoteService],
  controllers: [NoteController],
})
export class NotesModule {}
