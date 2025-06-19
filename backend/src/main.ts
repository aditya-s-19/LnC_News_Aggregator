import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe } from '@nestjs/common';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties not in the DTO
      forbidNonWhitelisted: true, // Throw error if unknown properties sent
      transform: true, // Automatically transform payloads to DTO classes
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
  console.log('App running on ', process.env.PORT ?? 3000);
}
bootstrap();
