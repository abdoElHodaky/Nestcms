import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AcceptOfferDto {
  
  @ApiProperty()
  readonly status:string;
  @ApiProperty()
  readonly offerId?:string;
  @ApiProperty()
  readonly clientId?:string;
}
