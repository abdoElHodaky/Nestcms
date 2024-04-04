import { Module } from '@nestjs/common';
//import { MongooseModule } from '@nestjs/mongoose';
import { NoteController } from './notes.controller';
//import { DesignSchema } from './models/design.schema';
@Module({
  imports: [],
  providers: [],
  exports: [],
  controllers: [NoteController],
})
export class NotesModule {}
