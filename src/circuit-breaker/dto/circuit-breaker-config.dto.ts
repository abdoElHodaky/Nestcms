import { IsNumber, IsString, Min, Max } from 'class-validator';

export class CircuitBreakerConfigDto {
  @IsString()
  name: string;

  @IsNumber()
  @Min(1000)
  @Max(300000) // Max 5 minutes
  timeout: number = 30000;

  @IsNumber()
  @Min(1)
  @Max(100)
  errorThreshold: number = 50;

  @IsNumber()
  @Min(1000)
  @Max(300000) // Max 5 minutes
  resetTimeout: number = 30000;

  @IsNumber()
  @Min(1000)
  @Max(60000) // Max 1 minute
  rollingTimeout: number = 10000;

  @IsNumber()
  @Min(1)
  @Max(100)
  rollingBuckets: number = 10;
}
