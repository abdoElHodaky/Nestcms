import { Module } from '@nestjs/common';
//import { NoteService } from './notes.service';
import { OrgzController } from './orgzs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OrgzSchema } from './models/note.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Orgz', schema: OrgzSchema }])],
  providers: [],
  exports: [],
  controllers: [OrgzController],
})
export class OrgzsModule {}
