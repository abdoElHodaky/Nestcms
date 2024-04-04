import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from "./create-user.dto";
export class CreateClientUserDto extends CreateUserDto {
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
  isEmployee?:boolean=false
  @ApiPropertyOptional()
   employeeType?:string=""
  @ApiPropertyOptional()
  isAdmin?:boolean=false
  @ApiPropertyOptional()
   adminType?:string=false
}
