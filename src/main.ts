import { NestFactory } from '@nestjs/core';
import { SwaggerTheme, SwaggerThemeNameEnum } from 'swagger-themes';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
const options = new DocumentBuilder()
    .setTitle('Construction Company Management System')
    .setDescription('Api for Construction company (parternship) workflow')
    .setVersion('1.1')
   /* .addBasicAuth()*/
    .addBearerAuth(
        {
          bearerFormat: 'Bearer',
          scheme: 'Bearer',
          type: 'http',
          in: 'Header',
        },
        'JWTAuthorization',
      )
    .addServer('/', '')
    .addTag('Auth',"Authentication")
    .addTag('Article','articles endpoints')
    .addTag('Project',"projects endpoints")
    .addTag('Schedule',"schedules endpoints")
    .addTag('Payment',"payments endpoints")
    .addTag('Offer',"offers endpoints")
    .addTag('Contract',"contract endpoints")
    .addTag('User',"users endpoints")
    .addTag('Schedule.Project'," schedules endpoints for specific project")
    .addTag('Project.Step'," project steps endpoints")
    .addTag('Project.Design',"designs endpoints of specific project")
    .addTag('Project.Note','projects notes endpoints')
    .addTag('Project.Worker','projects workers endpoints')
    .addTag('Orgz',"orginzations endpoints")
    .addTag('Note','notes endpoints')
    .build();
  
  const document = SwaggerModule.createDocument(app, options);
  const theme = new SwaggerTheme();
  SwaggerModule.setup('docs', app, document,{
  // swaggerOptions:{deepLinking: true},
    explorer: false,
    customCss: theme.getBuffer(SwaggerThemeNameEnum.ONE_DARK),
    customSiteTitle:"Endpoints of construction company",
    customfavIcon:" data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAjxJREFUOE+Vkk9I02EYx7/fd/stppHl3EYHK8JqP9H+MCLqUmH7lXXvFFK3IgiPhd6USupgF6ODSZ4UgqJLuS1ah04RhNK2/pFIJfstTbMcc/u9T2wOsYjU5/Twvt/v5/3yPg+xrGwzcvJNsBA9mkgUl5//r+fyy4xp9UHkYTAdi64JYJtWJ0QuAJgmpd+fiveuGvC+oXVDjVH8CkF12STo8b+NXWGpW0XRNiPDEJxe0lLuUqTHn376Thpa1/HD4/y/ONlQy84ijAVmzciECOoroi8Ax1yKA7XJg/ezoReXCRyAeM+IyrUpcU06dITATkJ8WnOUdigyAODsX690TFRP39gy74sL2O+GTDqidwlYC6pxJTKtIfsV+IiZ5pbtrrw3r135VxAEyyDiViAVa7fNyHUoldCOs0ORhyAYA7GXwkGQDULX0NIYv5lWlxbpXPxH3AmmY+ftkHXVBUlooIlkri4VvT3VeOycI7xEqHt/AhojLVojvpiAfYFU9KLdaF0TLc8UVJ2Gc9jR3g63OxeCqCMEfwIYLifImMfbDK0/FoknANaD0j1bMLprjGICwBDIOWhpF3CERJ7EDASfRbCtDLDNSGlxwgCqIdgnkBOBdDya2W1VBYs1hSSAgPzwFao8s15nzpObh3vzHv/38ZdZowKwuiqb+JxEWFhoCiQTpYgrVhkw1WTVa0hQHAwqUQ/q0iMdKzorgqUpSDhsZH/5bno86N04Gv20ZsBM86lNC87C1kAy9nq15pLuNwsR8zwBBPTJAAAAAElFTkSuQmCC "
  });
  
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
