import { ProjectController } from './projects.controller';
import { StepController } from './steps.controller';
import { DesignController } from './designs.controller';
import { NoteController } from './notes.controller';
import { Routes } from "@nestjs/core";

export const routes:Routes= [
    
    {
    path: 'api/projects',
    module:ProjectController,
    children: [
        {
            path: '/:id',
            children:[
              {
                path:"/designs",
                module:DesignController
              },
              {
                path:"/steps",
                module:StepController
              },{
                path:"/notes",
                module:NoteController
              }
            ]
        },
        
    ],
}];
