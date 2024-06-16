import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class AcceptOfferDto {

  @IsOptional()
  @ApiProperty()
  readonly status:string;
  
  @IsOptional()
  @IsObjectId()
  @ApiProperty()
  readonly offerId?:string;
  
  @IsOptional()
  @IsObjectId()
  @ApiProperty()
  readonly clientId?:string;
}
