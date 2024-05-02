import { Module } from '@nestjs/common';
import { PermissionService } from './permissions.service';
import { PermissionController } from './permissions.controller';
import { UsersModule} from "../users/users.module";
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionSchema } from './models/permission.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Permission', schema: PermissionSchema }]),UsersModule],
  providers: [PermissionService,  ],
  exports: [PermissionService, ],
  controllers: [PermissionController],
})
export class PermissionsModule {}
