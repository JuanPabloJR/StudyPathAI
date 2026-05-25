import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  // ─── Seguridad ─────────────────────────────────────────────────────────────
  app.use(helmet());
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ─── Prefijo global de API ─────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ─── Pipes de validación ───────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,           // elimina propiedades no decoradas
      forbidNonWhitelisted: true, // lanza error si hay propiedades extra
      transform: true,           // transforma automáticamente tipos
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Filtros e interceptores globales ──────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ─── Swagger (documentación API) ──────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('StudyPath AI API')
      .setDescription('API para generación de rutas de aprendizaje personalizadas con RAG')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Autenticación y autorización')
      .addTag('users', 'Gestión de usuarios y perfiles')
      .addTag('learning-paths', 'Rutas de aprendizaje')
      .addTag('rag', 'Pipeline RAG y base de conocimiento')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });

    console.log(`📚 Swagger disponible en: http://localhost:${process.env.PORT || 3001}/api/docs`);
  }

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`\n🚀 StudyPath AI API corriendo en: http://localhost:${port}/api`);
  console.log(`📊 Entorno: ${process.env.NODE_ENV || 'development'}\n`);
}

bootstrap();
