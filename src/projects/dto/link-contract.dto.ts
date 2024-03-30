import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinkToContractDto {
  @ApiProperty()
  readonly projectId: string;
  @ApiProperty()
  readonly contractId: string;
  
}
