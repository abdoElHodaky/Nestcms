import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional ,IsBoolean,IsEmail} from 'class-validator';
import { Address} from "../../address/interface/address";


export class CreateUserDto {
  
  @IsNotEmpty()
  @ApiProperty()
  readonly fullname:string
  
  @IsNotEmpty()
  @ApiProperty()
  readonly username:string


  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  readonly email: string;
  @ApiProperty()

  @IsNotEmpty()
  readonly password: string;

  @IsOptional()
  @ApiPropertyOptional({type:()=>Address,
    default:{
      country:"",
      street:"",
      state:"",
      city:""
    }
  })
  readonly address?:Address

  @IsNotEmpty()
  @ApiPropertyOptional()
  readonly phone?:string

  @IsBoolean()
  @ApiPropertyOptional()
   isEmployee?:boolean
  
  @IsOptional()
  @ApiPropertyOptional()
   employeeType?:string
  
  @IsBoolean()
  @ApiPropertyOptional()
   isAdmin?:boolean

  @IsOptional()
  @ApiPropertyOptional()
   adminType?:string
}
