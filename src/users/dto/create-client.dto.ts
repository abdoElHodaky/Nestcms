import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from "./create-user.dto";
export class CreateClientDto extends CreateUserDto {
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
   readonly isEmployee?:boolean=false
  @ApiPropertyOptional()
   readonly employeeType?:string=""
  @ApiPropertyOptional()
   readonly isAdmin?:boolean=false
  @ApiPropertyOptional()
   readonly adminType?:string=false
}
