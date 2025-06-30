import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { IsObjectId } from 'class-validator-mongo-object-id';
import {CreateEmployeeDto} from "../../users/dto"
type CreateWorker =Partial<CreateEmployeeDto>
export class CreateProjectWorkerDto extends CreateWorker {
  
  @IsOptional()
  @ApiPropertyOptional()
  readonly status?:string
  
  @IsNotEmpty()
  @IsObjectId()
  @ApiProperty()
  readonly projectId:string;
  
  
}
