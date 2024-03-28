import { SchedulesModule } from "./schedules/schedules.module";
import { ProjectsModule } from "./projects/projects.module";
import { AuthModule } from "./auth/auth.module";

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
    ],
}];
export const routes= [{
    path: '',
   // module: NinjaModule,
    children: [
        {
            path: '/auth',
            module: SchedulesModule,
        },
    ],
}];
