import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
//import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
//import { UsersModule } from './users/users.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ProjectsModule } from './projects/projects.module';
import { ContractsModule } from './contracts/contracts.module';
import { OffersModule } from './offers/offers.module';


@Module({
  imports: [
    MongooseModule.forRoot( process.env.MONGO_URI, { useNewUrlParser: true, useFindAndModify: false }),
    //ArticlesModule,
      AuthModule,
      //UsersModule, 
     SchedulesModule,
     ProjectsModule,
     OffersModule,
     //ContractsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
