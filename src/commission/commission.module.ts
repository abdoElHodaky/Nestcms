import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalarySchema , CommissionSchema} from './models/schema';
//import { ArticlesService } from './articles.service';
//import { ArticlesController } from './articles.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Salary', schema: SalarySchema },
                               { name: "Commission", schema: CommissionSchema}]),
  ],
  providers: [],
  controllers: [],
})
export class CommSalaryModule {}
