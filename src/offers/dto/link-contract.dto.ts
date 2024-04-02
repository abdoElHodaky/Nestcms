import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkToContractDto {
  @ApiProperty()
  readonly offerId: string;
  @ApiProperty()
  readonly contractId: string;
  
}
