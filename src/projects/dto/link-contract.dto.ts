import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LinktoToContractDto {
  @ApiProperty()
  readonly projectId: string;
  @ApiProperty()
  readonly contractId: string;
  
}
