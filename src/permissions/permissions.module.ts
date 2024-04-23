import { Module } from '@nestjs/common';
import { PermissionService } from './permissions.service';
import { APP_GUARD } from '@nestjs/core';
import { PermissionController } from './permissions.controller';
//import { PermGuard} from "../perm.guard";
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionSchema } from './models/permission.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Permission', schema: PermissionSchema }])],
  providers: [PermissionService],
  exports: [PermissionService],
  controllers: [PermissionController],
})
export class PermissionsModule {}
