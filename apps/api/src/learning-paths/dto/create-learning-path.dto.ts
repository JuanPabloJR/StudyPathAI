import {
  IsString,
  IsEnum,
  IsArray,
  IsInt,
  IsOptional,
  Min,
  Max,
  MinLength,
  ArrayMinSize,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum KnowledgeLevel {
  BEGINNER     = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED     = 'ADVANCED',
  EXPERT       = 'EXPERT',
}

export enum LearningFormat {
  VIDEO          = 'VIDEO',
  TEXT           = 'TEXT',
  INTERACTIVE    = 'INTERACTIVE',
  MIXED          = 'MIXED',
  PROJECT_BASED  = 'PROJECT_BASED',
}

export class CreateLearningPathDto {
  @ApiProperty({
    example: 'Programación en Python para análisis de datos',
    description: 'Tema principal de la ruta de aprendizaje',
  })
  @IsString()
  @MinLength(3, { message: 'El tema debe tener al menos 3 caracteres' })
  topic: string;

  @ApiProperty({
    enum: KnowledgeLevel,
    example: 'BEGINNER',
    description: 'Nivel de conocimiento actual del estudiante',
  })
  @IsEnum(KnowledgeLevel, { message: 'Nivel inválido' })
  level: KnowledgeLevel;

  @ApiProperty({
    example: [
      'Aprender a leer y limpiar datos con pandas',
      'Crear visualizaciones con matplotlib',
      'Aplicar estadísticas descriptivas básicas',
    ],
    description: 'Lista de objetivos específicos de aprendizaje (1-5)',
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Define al menos un objetivo' })
  @ArrayMaxSize(5, { message: 'Máximo 5 objetivos' })
  @IsString({ each: true })
  objectives: string[];

  @ApiProperty({
    example: 20,
    description: 'Total de horas disponibles para completar la ruta',
    minimum: 2,
    maximum: 200,
  })
  @IsInt({ message: 'El tiempo debe ser un número entero de horas' })
  @Min(2, { message: 'Mínimo 2 horas disponibles' })
  @Max(200, { message: 'Máximo 200 horas disponibles' })
  timeAvailable: number;

  @ApiProperty({
    enum: LearningFormat,
    example: 'MIXED',
    description: 'Formato de aprendizaje preferido',
  })
  @IsEnum(LearningFormat, { message: 'Formato inválido' })
  format: LearningFormat;

  @ApiPropertyOptional({
    example: 'Tengo dislexia, prefiero contenido visual con ejemplos prácticos',
    description: 'Necesidades especiales o preferencias de ritmo (opcional)',
  })
  @IsOptional()
  @IsString()
  specialNeeds?: string;
}
