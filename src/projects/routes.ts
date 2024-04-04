import { ProjectController } from './projects.controller';
import { StepController } from './steps.controller';
import { DesignController } from './designs.controller';
import { NoteController } from './notes.controller';
import { Routes } from "@nestjs/core";

export const routes:Routes= [
    
    {
    path: 'api/projects',
    controller:ProjectController,
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
