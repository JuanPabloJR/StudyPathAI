import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
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

    // Módulos de la aplicación
    PrismaModule,
    AuthModule,
    UsersModule,
    LearningPathsModule,
    RagModule,
  ],
})
export class AppModule {}
