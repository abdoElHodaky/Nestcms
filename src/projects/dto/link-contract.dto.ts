import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class ProjectLinkToContractDto {
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly projectId: string;
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly contractId: string;
  
}
