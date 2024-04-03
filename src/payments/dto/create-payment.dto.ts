import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePaymentDto {
  @ApiProperty()
  readonly title: string;
  @ApiProperty()
  readonly content: string;
  @ApiProperty()
  readonly Date:string
  @ApiPropertyOptional()
  readonly status:string;
  @ApiProperty()
  readonly amount:number;
  @ApiProperty()
  readonly currency:string;
 
  
}
