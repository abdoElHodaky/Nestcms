import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class ProjectLinkToContractDto {
  
  @IsNotEmpty()
  @ApiProperty()
  readonly projectId: string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly contractId: string;
  
}
