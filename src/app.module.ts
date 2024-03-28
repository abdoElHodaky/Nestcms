import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RouteModule} from "@nestjs/core";
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArticlesModule } from './articles/articles.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ProjectsModule } from './projects/projects.module';
//import { DesignsModule } from './projects/designs.module';
import {apiroutes,homeroutes} from "./routes.ts";

@Module({
  imports: [
    MongooseModule.forRoot("mongodb+srv://abdoarh36:TyWF4ABOefQhJFbP@cluster0.bc7sxu7.mongodb.net/nestcms", { useNewUrlParser: true, useFindAndModify: false }),
    //ArticlesModule,
   /* AuthModule,
    UsersModule, 
    SchedulesModule,
    ProjectsModule,*/
    //DesignsModule,
    RouterModule.forRoot(homeroutes),
    RouterModule.forRoot(apiroutes)
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
