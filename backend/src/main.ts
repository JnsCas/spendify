import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { WebLoggerMiddleware } from './middlewares/web-logger.middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Debug middleware - log all requests
  const webLogger = new WebLoggerMiddleware();
  app.use(webLogger.use.bind(webLogger));

  // Enable CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Spendify backend running on http://localhost:${port}`);
}
bootstrap();
