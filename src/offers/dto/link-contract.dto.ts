import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObjectId } from 'class-validator-mongo-object-id';
import { IsNotEmpty, IsOptional } from 'class-validator';

export class OfferLinkToContractDto {
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly offerId: string;
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly contractId: string;
  
}
