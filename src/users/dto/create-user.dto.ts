import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional ,IsBoolean,IsEmail,IsPhone} from 'class-validator';

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
  @ApiPropertyOptional({type:Object,
    example:{
      country:"",
      street:"",
      postalCode:""
    }
  })
  readonly address?:{
    city:string,
    street:string,
    postalCode:string,
    country:string
  }

  @IsNotEmpty()
  @IsPhone()
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
