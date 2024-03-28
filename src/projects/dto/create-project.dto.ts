import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty()
  readonly title: string;
  @ApiProperty()
  readonly content: string;
  @ApiProperty()
  readonly startDate: string;
  @ApiProperty()
  readonly endDate:string;
  @ApiPropertyOptional()
  readonly status:string;
  @ApiPropertyOptional()
  readonly employeeId?:string;
  
}
