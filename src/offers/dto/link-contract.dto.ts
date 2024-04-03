import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OfferLinkToContractDto {
  @ApiProperty()
  readonly offerId: string;
  @ApiProperty()
  readonly contractId: string;
  
}
