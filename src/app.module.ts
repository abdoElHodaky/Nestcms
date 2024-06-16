import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
//import { RouterModule } from "@nestjs/core";
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';
import { APP_GUARD } from '@nestjs/core';
import { PermGuard } from "./perm.guard";
import { modules } from "./modules.app";
@Module({
  imports: [
    MongooseModule.forRoot( process.env.MONGO_URI, {connectTimeoutMS: 10000,
        socketTimeoutMS: 30000 }),
    ...modules
  ],
  controllers: [AppController],
  providers: [AppService,{
    provide:APP_GUARD,
    useClass:PermGuard
  },
   /* {
      provide:APP_GUARD,
      useClass:OptionalJwtAuthGuard
    }*/
  ],
})
export class AppModule {}
