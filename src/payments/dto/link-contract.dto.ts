import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaymentLinkToContractDto {
  @ApiProperty()
  readonly paymentId: string;
  @ApiProperty()
  readonly contractId: string;
  
}
