import { Module } from '@nestjs/common';
import { OrgzService } from './orgzs.service';
import { OrgzController } from './orgzs.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { OrgzSchema } from './models/orgz.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Orgz', schema: OrgzSchema }])],
  providers: [ OrgzService  ],
  exports: [ OrgzService ],
  controllers: [OrgzController],
})
export class OrgzsModule {}
