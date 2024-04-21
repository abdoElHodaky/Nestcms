import { Module } from '@nestjs/common';
import { PermissionService } from './permissions.service';
import { APP_GUARD } from '@nestjs/core';
//import { APP_GUARD } from '@nestjs/core';
import { PermGuard} from "../perm.guard";
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionSchema } from './models/permission.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Permission', schema: PermissionSchema }])],
  providers: [PermissionService,{
    provide:APP_GUARD,
    useClass:PermGuard
  }],
  exports: [PermissionService,PermGuard],
  controllers: [],
})
export class PermissionsModule {}
