import { ProjectController } from './projects.controller';
import { StepController } from './steps.controller';
import { DesignController } from './designs.controller';
import { NoteController } from './notes.controller';


export const routes= [
    
    {
    path: 'api/projects',
    controller:ProjectCintroller,
    children: [
        {
            path: '/:id',
            children:[
              {
                path:"/designs",
                controller:DesignController
              },
              {
                path:"/steps",
                controller:StepController
              },{
                path:"/notes",
                controller:NoteController
              }
            ]
        },
        
    ],
}];
