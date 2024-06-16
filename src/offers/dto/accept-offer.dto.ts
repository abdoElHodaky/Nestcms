import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class AcceptOfferDto {

  @IsOptional()
  @ApiProperty()
  readonly status:string;
  
  @IsOptional()
  @ApiProperty()
  readonly offerId?:string;
  
  @IsOptional()
  @ApiProperty()
  readonly clientId?:string;
}
