import { Module } from '@nestjs/common';
import { EarningService } from './earning.service';
/*import { ProjectController,WorkerController,
        StepController,DesignController,
        NoteController
       } from './controllers/';*/
import { MongooseModule } from '@nestjs/mongoose';
import { ProjectEarningSchema ,OrgzEarningSchema
       } from './models/schema';

@Module({
  imports: [MongooseModule.forFeature([//{ name: 'Earnings', schema: EarningSchema },
                                       {name: 'ProjectEarning', schema: ProjectEarningSchema},
                                       {name: 'OrgzEarning',schema: OrgzEarningSchema}
                                    ])],
  providers: [EarningService],
  exports: [EarningService],/*
  controllers: [ProjectController,NoteController,
                DesignController,StepController,
                WorkerController ],*/
})
export class EarningsModule {}
