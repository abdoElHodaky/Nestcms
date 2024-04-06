import { Module } from '@nestjs/common';
import { PermissionService } from './permissions.service';
//import { NoteController } from './notes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionSchema } from './models/permission.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Permission', schema: PermissionSchema }])],
  providers: [PermissionService],
  exports: [PermissionService],
  controllers: [],
})
export class PermissionsModule {}
