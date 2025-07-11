import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';

export class CompoundEarningDto {
  
  @IsNotEmpty()
  @ApiProperty({
    type:String,
    example:"project",
    enum:["project","orgz"]
  })
  readonly type: string;

  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly Id: string;
  
}
