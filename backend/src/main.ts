import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }));

  app.use(cookieParser());

  // CORS: only frontend origin + credentials
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
    methods: ['GET','POST','DELETE','PUT','PATCH','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  // Global input validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // strip unknown fields
    forbidNonWhitelisted: true, // 400 on extra fields
    transform: true,            // payload -> DTO types
    transformOptions: { enableImplicitConversion: true },
  }));

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
