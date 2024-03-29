import { Module } from '@nestjs/common';
import { ContractService } from './contracts.service';
import { ContractController } from './contracts.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ContractSchema } from './models/contract.schema';
@Module({
  imports: [MongooseModule.forFeature([{ name: 'Contract', schema: ContractSchema }])],
  providers: [ContractService],
  exports: [ContractService],
  controllers: [ContractController],
})
export class ContractsModule {}
