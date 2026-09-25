import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { LearningPathsService } from './learning-paths.service';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@ApiTags('learning-paths')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly service: LearningPathsService) {}

  /**
   * POST /api/learning-paths
   * Genera una nueva ruta de aprendizaje con RAG + Claude
   */
  @Post()
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // cada llamada consume cuota del LLM
  @ApiOperation({
    summary: 'Generar ruta de aprendizaje',
    description: 'Crea una nueva ruta personalizada usando RAG y LLM. Puede tomar 10-30 segundos.',
  })
  @ApiResponse({ status: 201, description: 'Ruta generada exitosamente' })
  @ApiResponse({ status: 502, description: 'Error al contactar la API de IA' })
  @ApiResponse({ status: 429, description: 'Demasiadas solicitudes (máx. 5 por minuto)' })
  async create(@Request() req: any, @Body() dto: CreateLearningPathDto) {
    return this.service.create(req.user.id, dto);
  }

  /**
   * GET /api/learning-paths
   * Listar todas las rutas del usuario autenticado
   */
  @Get()
  @ApiOperation({ summary: 'Listar rutas del usuario' })
  @ApiResponse({ status: 200, description: 'Lista de rutas con porcentaje de progreso' })
  async findAll(@Request() req: any) {
    return this.service.findAll(req.user.id);
  }

  /**
   * GET /api/learning-paths/stats
   * Estadísticas generales del usuario
   */
  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas de aprendizaje del usuario' })
  async getStats(@Request() req: any) {
    return this.service.getUserStats(req.user.id);
  }

  /**
   * GET /api/learning-paths/:id
   * Obtener una ruta con todos sus módulos y progreso
   */
  @Get(':id')
  @ApiOperation({ summary: 'Obtener ruta de aprendizaje completa' })
  @ApiParam({ name: 'id', description: 'ID de la ruta' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id);
  }

  /**
   * PATCH /api/learning-paths/:pathId/modules/:moduleId/progress
   * Actualizar progreso de un módulo
   */
  @Patch(':pathId/modules/:moduleId/progress')
  @ApiOperation({ summary: 'Actualizar progreso del módulo' })
  @ApiParam({ name: 'pathId', description: 'ID de la ruta' })
  @ApiParam({ name: 'moduleId', description: 'ID del módulo' })
  async updateProgress(
    @Request() req: any,
    @Param('pathId') pathId: string,
    @Param('moduleId') moduleId: string,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.service.updateProgress(pathId, moduleId, req.user.id, dto);
  }

  /**
   * POST /api/learning-paths/:id/regenerate
   * Regenerar la ruta con ajustes opcionales
   */
  @Post(':id/regenerate')
  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // cada llamada consume cuota del LLM
  @ApiOperation({ summary: 'Regenerar ruta con ajustes' })
  @ApiParam({ name: 'id', description: 'ID de la ruta a regenerar' })
  async regenerate(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { adjustments?: string },
  ) {
    return this.service.regenerate(id, req.user.id, body.adjustments);
  }

  /**
   * DELETE /api/learning-paths/:id
   * Eliminar una ruta de aprendizaje
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar ruta de aprendizaje' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.service.remove(id, req.user.id);
  }
}
