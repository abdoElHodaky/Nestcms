import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
import { Address} from "../../address/interface/address";

export class CreateOrgzDto {
  
  @IsNotEmpty()
  @ApiProperty()
  readonly title: string;
  
  @IsNotEmpty()
  @ApiProperty()
  readonly description: string;
  
  @IsOptional()
  @ApiPropertyOptional()
  readonly status:string;
  
  @IsOptional()
  @IsObjectId()
  @ApiPropertyOptional()
  readonly ownerId:string;
  
  @IsNotEmpty()
  @ApiProperty({type:()=>Address ,
    default:{
      street:"",
      city:"",
      state:"",
      country:""
    }
  })
  readonly address:Address
}
