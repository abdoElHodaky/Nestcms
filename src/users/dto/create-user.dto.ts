import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty()
  readonly fullname:string
  @ApiProperty()
  readonly username:string
  @ApiProperty()
  readonly email: string;
  @ApiProperty()
  readonly password: string;
  @ApiPropertyOptional()
  readonly address?:string
  @ApiPropertyOptional()
  readonly phone?:string
  @ApiPropertyOptional()
   isEmployee?:boolean
  @ApiPropertyOptional()
   employeeType?:string
  @ApiPropertyOptional()
   isAdmin?:boolean
  @ApiPropertyOptional()
   adminType?:string
}
