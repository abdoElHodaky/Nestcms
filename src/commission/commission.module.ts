import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalarySchema , CommissionSchema} from './models/schema';
import { SalaryService } from './services/salary.service';
import { CommissionService} from './services/commission.service'
//import { ArticlesController } from './articles.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Salary', schema: SalarySchema },
                               { name: "Commission", schema: CommissionSchema}]),
  ],
  providers: [SalaryService, CommissionService],
  controllers: [],
})
export class CommSalaryModule {}
