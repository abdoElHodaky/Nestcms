import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from "./create-user.dto";
export class CreateClientDto extends CreateUserDto {
  
  @ApiPropertyOptional()
    isEmployee?:boolean=false
  @ApiPropertyOptional()
    employeeType?:string=""
  @ApiPropertyOptional()
    isAdmin?:boolean=false
  @ApiPropertyOptional()
    adminType?:string=""
}
