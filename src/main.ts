import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
const options = new DocumentBuilder()
    .setTitle('nestcmsapi')
    .setDescription('')
    .setVersion('1.0')
    .addServer('/', '')
    .build();

const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('/api/docs', app, document);
  app.enableCors();
  await app.listen(3000);
}
bootstrap();
