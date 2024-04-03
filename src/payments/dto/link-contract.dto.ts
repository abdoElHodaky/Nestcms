import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentLinkToContractDto {
  @ApiProperty()
   paymentId: string;
  @ApiProperty()
   contractId: string;
  
}
