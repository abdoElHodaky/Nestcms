import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AggregationService } from './aggregation.service';
import { DatabaseModule } from '../database/database.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    CacheModule,
  ],
  providers: [AggregationService],
  exports: [AggregationService],
})
export class AggregationModule {}
