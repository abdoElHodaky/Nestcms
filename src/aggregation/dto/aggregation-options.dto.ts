import { IsOptional, IsBoolean, IsNumber, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AggregationOptionsDto {
  @ApiPropertyOptional({ description: 'Use read replica for query execution' })
  @IsOptional()
  @IsBoolean()
  useReplica?: boolean = true;

  @ApiPropertyOptional({ 
    description: 'Read preference for MongoDB query',
    enum: ['primary', 'secondary', 'secondaryPreferred', 'primaryPreferred']
  })
  @IsOptional()
  @IsEnum(['primary', 'secondary', 'secondaryPreferred', 'primaryPreferred'])
  readPreference?: 'primary' | 'secondary' | 'secondaryPreferred' | 'primaryPreferred';

  @ApiPropertyOptional({ description: 'Maximum query execution time in milliseconds' })
  @IsOptional()
  @IsNumber()
  maxTimeMS?: number;

  @ApiPropertyOptional({ description: 'Enable caching for this query' })
  @IsOptional()
  @IsBoolean()
  useCache?: boolean = true;

  @ApiPropertyOptional({ description: 'Cache TTL in seconds' })
  @IsOptional()
  @IsNumber()
  cacheTTL?: number;

  @ApiPropertyOptional({ description: 'Custom cache key' })
  @IsOptional()
  @IsString()
  cacheKey?: string;

  @ApiPropertyOptional({ description: 'Warm cache after query execution' })
  @IsOptional()
  @IsBoolean()
  warmCache?: boolean = false;

  @ApiPropertyOptional({ description: 'Invalidate existing cache before query' })
  @IsOptional()
  @IsBoolean()
  invalidateCache?: boolean = false;

  @ApiPropertyOptional({ description: 'Enable compression for cached results' })
  @IsOptional()
  @IsBoolean()
  compress?: boolean = true;
}

export class AggregationQueryDto {
  @ApiPropertyOptional({ description: 'Collection name for aggregation' })
  @IsOptional()
  @IsString()
  collection?: string;

  @ApiPropertyOptional({ description: 'Aggregation pipeline stages' })
  pipeline?: any[];

  @ApiPropertyOptional({ description: 'Aggregation options' })
  @IsOptional()
  options?: AggregationOptionsDto;
}
