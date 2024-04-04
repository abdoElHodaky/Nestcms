import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from "./create-user.dto";
export class CreateEmployeeDto extends CreateUserDto {
  
  @ApiProperty()
    isEmployee?:boolean=true
  @ApiProperty()
    employeeType?:string
  @ApiPropertyOptional()
    isAdmin?:boolean=false
  @ApiPropertyOptional()
    adminType?:string=""
}
