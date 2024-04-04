import { Module } from '@nestjs/common';
import { ProjectService } from './projects.service';

//import { MongooseModule } from '@nestjs/mongoose';
import { NoteController } from './notes.controller';
//import { DesignSchema } from './models/design.schema';
@Module({
  imports: [],
  providers: [ProjectService ],
  exports: [ ],
  controllers: [NoteController],
})
export class NotesModule {}
