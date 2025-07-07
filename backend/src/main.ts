import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
import { UnhandledExceptionFilter } from './filters/unhandled-exception.filter';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new UnhandledExceptionFilter());
  await app.listen(process.env.PORT ?? 3000);
  console.log('App running on ', process.env.PORT ?? 3000);
}
bootstrap();
