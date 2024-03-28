import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOfferDto {
  
  @ApiProperty()
  readonly title: string;
  @ApiProperty()
  readonly content: string;
  @ApiProperty()
  readonly startDate: string;
  @ApiProperty()
  readonly endDate:string;
  @ApiProperty()
  readonly status:string;
  @ApiPropertyOptional()
  readonly employeeId?:string;
}
