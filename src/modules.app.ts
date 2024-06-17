import { PaymentsModule } from './payments/';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/';
import { SchedulesModule } from './schedules/';
import { ProjectsModule } from './projects/';
import { ContractsModule } from './contracts/';
import { OffersModule } from './offers/';
import { NotesModule } from "./notes/";
import { PermissionsModule } from "./permissions/";
import { ArticlesModule } from "./articles/";
import { OrgzsModule} from "./orgs/";
export const modules=[PermissionsModule,AuthModule,ContractsModule,
               UsersModule,SchedulesModule,PaymentsModule,
               ProjectsModule,OffersModule,OrgzsModule,
               NotesModule,ArticlesModule]
