import { Module } from '@nestjs/common';
import { ContractService } from './contracts.service';
import { ProjectController } from './contracts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractSchema } from './models/contract.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Project', schema: ProjectSchema },{name: 'Design', schema: DesignSchema}])],
  providers: [ContractService],
  exports: [ContractService],
  controllers: [ContractController],
})
export class ContractsModule {}
