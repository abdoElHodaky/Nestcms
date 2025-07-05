import { Module } from '@nestjs/common';
import { EarningService } from './earning.service';
import { EarningController } from './earnings.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectEarningSchema ,OrgzEarningSchema
       } from './models/schema';

@Module({
  imports: [MongooseModule.forFeature([//{ name: 'Earnings', schema: EarningSchema },
                                       {name: 'ProjectEarning', schema: ProjectEarningSchema},
                                       {name: 'OrgzEarning',schema: OrgzEarningSchema}
                                    ])],
  providers: [EarningService],
  exports: [EarningService],
  controllers: [EarningController],
})
export class EarningsModule {}
