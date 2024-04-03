import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProjectLinkToContractDto {
  @ApiProperty()
  readonly projectId: string;
  @ApiProperty()
  readonly contractId: string;
  
}
