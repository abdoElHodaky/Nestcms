import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CircuitBreakerService } from './circuit-breaker.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [CircuitBreakerService],
  exports: [CircuitBreakerService],
})
export class CircuitBreakerModule {}
