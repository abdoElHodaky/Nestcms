import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
//import { RouterModule } from "@nestjs/core";
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';
import { APP_GUARD } from '@nestjs/core';
import { PermGuard } from "./perm.guard";
import { modules } from "./modules.app";
import { CacheModule } from './cache/cache.module';
import { DatabaseModule } from './database/database.module';
import { AggregationModule } from './aggregation/aggregation.module';
import { DatabaseConfigService } from './database/database-config.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    MongooseModule.forRootAsync({
      imports: [DatabaseModule],
      useFactory: async (databaseConfigService: DatabaseConfigService) => {
        return databaseConfigService.getMongooseConfig();
      },
      inject: [DatabaseConfigService],
    }),
    CacheModule,
    DatabaseModule,
    AggregationModule,
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
