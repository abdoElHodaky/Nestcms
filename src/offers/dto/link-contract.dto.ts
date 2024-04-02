import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkToContractDto {
  @ApiProperty()
  readonly OfferId: string;
  @ApiProperty()
  readonly contractId: string;
  
}
