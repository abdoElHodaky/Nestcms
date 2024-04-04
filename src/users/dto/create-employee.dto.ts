import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateUserDto } from "./dto/create-user.dto";
export class CreateEmployeeDto extends CreateUserDto {
  
  @ApiProperty()
   readonly isEmployee?:boolean=true
  @ApiProperty()
   readonly employeeType?:string
  @ApiPropertyOptional()
   readonly isAdmin?:boolean=false
  @ApiPropertyOptional()
   readonly adminType?:string=""
}
