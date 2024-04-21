import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
//import { RouterModule } from "@nestjs/core";
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';
/*import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ProjectsModule } from './projects/projects.module';
import { ContractsModule } from './contracts/contracts.module';
import { OffersModule } from './offers/offers.module';
import { NotesModule } from "./notes/notes.module";
import { PermissionsModule } from "./permissions/permissions.module";
*/
import { APP_GUARD } from '@nestjs/core';
import { PermGuard} from "./perm.guard";
import { modules } from "./modules.app";
@Module({
  imports: [
    MongooseModule.forRoot( process.env.MONGO_URI, {connectTimeoutMS: 10000,
        socketTimeoutMS: 30000 }),
      /*AuthModule,
      UsersModule,
      PaymentsModule,
      NotesModule,
      SchedulesModule,
      ProjectsModule,
      OffersModule,
      ContractsModule,
      PermissionsModule */
    ...modules
  ],
  controllers: [AppController],
  providers: [AppService,{
    provide:APP_GUARD,
    useClass:PermGuard
  }
  ],
})
export class AppModule {}
