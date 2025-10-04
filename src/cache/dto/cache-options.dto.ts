import { IsOptional, IsNumber, IsBoolean, IsString, Min, Max } from 'class-validator';

export class CacheOptionsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(86400) // Max 24 hours
  ttl?: number = 3600; // Default 1 hour

  @IsOptional()
  @IsBoolean()
  useCache?: boolean = true;

  @IsOptional()
  @IsBoolean()
  compress?: boolean = false;

  @IsOptional()
  @IsString()
  namespace?: string = 'default';
}

export class CacheKeyOptionsDto {
  @IsOptional()
  @IsString()
  prefix?: string;

  @IsOptional()
  @IsString()
  suffix?: string;

  @IsOptional()
  @IsBoolean()
  includeTimestamp?: boolean = false;
}
