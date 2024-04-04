import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from "./create-user.dto";
export class CreateClientDto extends CreateUserDto {
  
  @ApiPropertyOptional()
   readonly isEmployee?:boolean=false
  @ApiPropertyOptional()
   readonly employeeType?:string=""
  @ApiPropertyOptional()
   readonly isAdmin?:boolean=false
  @ApiPropertyOptional()
   readonly adminType?:string=false
}
