import { Module } from '@nestjs/common';
import { PermissionService } from './permissions.service';
import { PermissionController } from './permissions.controller';
import { UsersService} from "../users/users.service";
import { MongooseModule } from '@nestjs/mongoose';
import { PermissionSchema } from './models/permission.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Permission', schema: PermissionSchema }])],
  providers: [PermissionService,  ],
  exports: [PermissionService, ],
  controllers: [PermissionController],
})
export class PermissionsModule {}
