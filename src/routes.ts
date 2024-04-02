import { SchedulesModule } from "./schedules/schedules.module";
import { ProjectsModule } from "./projects/projects.module";
import { AuthModule } from "./auth/auth.module";
import { ContractsModule } from "./contracts/contracts.module";
import { OffersModule } from "./offers/offers.module";
import { UsersModule } from "./users/users.module";
export const apiroutes= [{
    path: 'api',
   // module: NinjaModule,
    children: [
        {
            path: '/schedules',
            module: SchedulesModule,
        },
        {
            path: '/projects',
            module: ProjectsModule,
        },
        {
            path: '/contracts',
            module: ContractsModule,
        },
        {
            path: '/offers',
            module: OfferssModule,
        }
    ],
}];
export const homeroutes= [{
    path: '',
   // module: NinjaModule,
    children: [
        {
            path: '/auth',
            module: AuthModule,
        },
        {
            path: '/users',
            module: UsersModule,
        }
    ],
}];
