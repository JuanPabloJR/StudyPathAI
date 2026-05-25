import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiPropertyOptional({ example: true, description: 'Marcar el módulo como completado' })
  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @ApiPropertyOptional({ example: 85, description: 'Puntuación del módulo (0-100)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @ApiPropertyOptional({ example: 45, description: 'Tiempo invertido en el módulo (minutos)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  timeSpent?: number;

  @ApiPropertyOptional({ example: 'Excelente explicación de callbacks en JS' })
  @IsOptional()
  @IsString()
  notes?: string;
}
