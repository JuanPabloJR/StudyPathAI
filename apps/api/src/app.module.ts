import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LearningPathsModule } from './learning-paths/learning-paths.module';
import { RagModule } from './rag/rag.module';

@Module({
  imports: [
    // Variables de entorno disponibles globalmente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Límite global de peticiones por IP (60/min).
    // Los endpoints que llaman al LLM tienen un límite más estricto con @Throttle.
    ThrottlerModule.forRoot({
      throttlers:   [{ ttl: 60_000, limit: 60 }],
      errorMessage: 'Demasiadas solicitudes. Espera un minuto e intenta de nuevo.',
    }),

    // Módulos de la aplicación
    PrismaModule,
    AuthModule,
    UsersModule,
    LearningPathsModule,
    RagModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
