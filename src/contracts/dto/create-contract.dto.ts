import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateContractDto {
  @ApiProperty()
  readonly title: string;
  @ApiProperty()
  readonly content: string;
  @ApiPropertyOptional()
  readonly author: string;
  @ApiProperty()
  readonly startDate: string;
  @ApiProperty()
  readonly endDate:string;
  @ApiProperty()
  readonly status:string;
  @ApiPropertyOptional()
  readonly path?:string
  //readonly employeeId?:string;

}
