import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class PaymentLinkToContractDto {
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  paymentId: string;

  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  contractId: string;
  
}
