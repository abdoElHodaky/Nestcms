import { PaymentsModule } from './payments/payments.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ProjectsModule } from './projects/projects.module';
import { ContractsModule } from './contracts/contracts.module';
import { OffersModule } from './offers/offers.module';
import { NotesModule } from "./notes/notes.module";
import { PermissionsModule } from "./permissions/permissions.module";
import { ArticlesModule } from "./articles/articles.module";

export const modules=[PermissionsModule,AuthModule,
               UsersModule,SchedulesModule,
               ProjectsModule,OffersModule,
               NotesModule,ArticlesModule]
