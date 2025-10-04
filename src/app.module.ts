import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
//import { RouterModule } from "@nestjs/core";
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PaymentsModule } from './payments/payments.module';
import { APP_GUARD } from '@nestjs/core';
import { PermGuard } from "./perm.guard";
import { modules } from "./modules.app";

// Import new enhanced modules
import { CacheModule } from './cache/cache.module';
import { CircuitBreakerModule } from './circuit-breaker/circuit-breaker.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { AggregationModule } from './aggregation/aggregation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    EventEmitterModule.forRoot({
      // Use this instance across the whole app
      global: true,
      // Set this to `true` to use wildcards
      wildcard: false,
      // The delimiter used to segment namespaces
      delimiter: '.',
      // Set this to `true` if you want to emit the newListener event
      newListener: false,
      // Set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // The maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // Show event name in memory leak message when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // Disable throwing uncaughtException if an error event is emitted and it has no listeners
      ignoreErrors: false,
    }),
    MongooseModule.forRoot( process.env.MONGO_URI, {
      connectTimeoutMS: 10000,
      socketTimeoutMS: 30000,
      // Enhanced MongoDB configuration for read replicas
      readPreference: 'secondaryPreferred',
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      heartbeatFrequencyMS: 10000,
    }),
    // Enhanced modules
    DatabaseModule,
    AggregationModule,
    CacheModule,
    CircuitBreakerModule,
    HealthModule,
    // Existing modules
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
