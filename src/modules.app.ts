import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/';
import { SchedulesModule } from './schedules/';
import { ProjectsModule } from './projects/';
import { ContractsModule } from './contracts/';
import { OffersModule } from './offers/';
import { NotesModule } from "./notes/notes.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { ArticlesModule } from "./articles/";
import { OrgzsModule} from "./orgs/orgzs.module";
export const modules=[PermissionsModule,AuthModule,ContractsModule,
               UsersModule,SchedulesModule,PaymentsModule,
               ProjectsModule,OffersModule,OrgzsModule,
               NotesModule,ArticlesModule]
