import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
const options = new DocumentBuilder()
    .setTitle('nestcmsapi')
    .setDescription('Api for Construction company workflow')
    .setVersion('1.0')
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
    .addTag('Project',"projects endpoints")
    .addTag('Schedule',"schedules endpoints")
    .addTag('Payment',"payments endpoints")
    .addTag('Offer',"offers endpoints")
    .addTag('Contract',"contract endpoints")
    .addTag('User',"users endpoints")
    .addTag('Project.Schedule'," schedules endpoints for specific project")
    .addTag('Project.Step'," project steps endpoints")
    .addTag('Project.Design',"designs endpoints of specific project")
    .build();
  
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
