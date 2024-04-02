import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RouterModule } from "@nestjs/core";
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ProjectsModule } from './projects/projects.module';
import { ContractsModule } from './contracts/contracts.module';
import { OffersModule } from './offers/offers.module';
import { homeroutes,apiroutes} from ".routes";

@Module({
  imports: [
    MongooseModule.forRoot( process.env.MONGO_URI, {connectTimeoutMS: 10000,
        socketTimeoutMS: 30000 }),
    RouterModule.forRoot([homeroutes,apiroutes])
     /* AuthModule,
      UsersModule, 
     SchedulesModule,
     ProjectsModule,
      OffersModule,
     ContractsModule,*/
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
