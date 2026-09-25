import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RagService } from '../rag/rag.service';
import { CreateLearningPathDto } from './dto/create-learning-path.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class LearningPathsService {
  private readonly logger = new Logger(LearningPathsService.name);

  constructor(
    private prisma: PrismaService,
    private rag: RagService,
  ) {}

  // ─── Crear nueva ruta de aprendizaje ────────────────────────────────────────
  async create(userId: string, dto: CreateLearningPathDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    this.logger.log(`📝 Creando ruta para usuario ${userId}: "${dto.topic}"`);

    // Crear la ruta en estado GENERATING
    const path = await this.prisma.learningPath.create({
      data: {
        userId,
        title: `Ruta: ${dto.topic}`,
        topic: dto.topic,
        level: dto.level,
        objectives: dto.objectives,
        timeAvailable: dto.timeAvailable,
        format: dto.format,
        specialNeeds: dto.specialNeeds,
        status: 'GENERATING',
      },
    });

    try {
      // Ejecutar pipeline RAG
      const generated = await this.rag.generateLearningPath({
        topic: dto.topic,
        level: dto.level,
        objectives: dto.objectives,
        timeAvailable: dto.timeAvailable,
        format: dto.format,
        specialNeeds: dto.specialNeeds,
        userName: user?.name,
      });

      // Guardar todo en una transacción
      const updatedPath = await this.prisma.$transaction(async (tx) => {
        // Actualizar la ruta con título y metadata generada
        const updated = await tx.learningPath.update({
          where: { id: path.id },
          data: {
            title: generated.title,
            status: 'ACTIVE',
            totalModules: generated.modules.length,
            estimatedHours: generated.estimatedHours,
            ragSources: generated.ragSources as any,
            generationMeta: generated.generationMeta as any,
          },
        });

        // Crear módulos con recursos y actividades
        for (const mod of generated.modules) {
          await tx.module.create({
            data: {
              pathId: path.id,
              order: mod.order,
              title: mod.title,
              objective: mod.objective,
              description: mod.description,
              content: mod.content,
              estimatedTime: mod.estimatedTime,
              tips: mod.tips,
              resources: {
                create: mod.resources.map((r, i) => ({
                  title: r.title,
                  url: r.url,
                  type: r.type,
                  description: r.description,
                  author: r.author,
                  isFree: r.isFree,
                  order: i,
                })),
              },
              activities: {
                create: mod.activities.map((a) => ({
                  title: a.title,
                  description: a.description,
                  type: a.type,
                  durationMin: a.durationMin,
                  order: a.order,
                })),
              },
              progress: {
                create: {
                  completed: false,
                  timeSpent: 0,
                },
              },
            },
          });
        }

        return updated;
      });

      this.logger.log(`✅ Ruta ${path.id} generada con ${generated.modules.length} módulos`);
      return this.findOne(path.id, userId);
    } catch (error) {
      // Si falla la generación, marcar como fallida
      await this.prisma.learningPath.update({
        where: { id: path.id },
        data: { status: 'FAILED' },
      });
      throw error;
    }
  }

  // ─── Listar rutas del usuario ────────────────────────────────────────────────
  async findAll(userId: string) {
    const paths = await this.prisma.learningPath.findMany({
      where: { userId },
      include: {
        modules: {
          select: {
            id: true,
            progress: { select: { completed: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calcular progreso para cada ruta
    return paths.map((path) => {
      const totalModules = path.modules.length;
      const completedModules = path.modules.filter(
        (m) => m.progress?.completed,
      ).length;
      const progressPercent =
        totalModules > 0
          ? Math.round((completedModules / totalModules) * 100)
          : 0;

      const { modules, ...pathData } = path;
      return {
        ...pathData,
        progress: {
          totalModules,
          completedModules,
          percent: progressPercent,
        },
      };
    });
  }

  // ─── Obtener una ruta completa ───────────────────────────────────────────────
  async findOne(pathId: string, userId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
      include: {
        modules: {
          orderBy: { order: 'asc' },
          include: {
            resources: { orderBy: { order: 'asc' } },
            activities: { orderBy: { order: 'asc' } },
            progress: true,
          },
        },
      },
    });

    if (!path) {
      throw new NotFoundException('Ruta de aprendizaje no encontrada');
    }

    if (path.userId !== userId) {
      throw new ForbiddenException('No tienes acceso a esta ruta');
    }

    // Calcular estadísticas de progreso
    const totalModules = path.modules.length;
    const completedModules = path.modules.filter(
      (m) => m.progress?.completed,
    ).length;
    const totalTimeSpent = path.modules.reduce(
      (acc, m) => acc + (m.progress?.timeSpent || 0),
      0,
    );

    return {
      ...path,
      stats: {
        totalModules,
        completedModules,
        percent: totalModules > 0
          ? Math.round((completedModules / totalModules) * 100)
          : 0,
        totalTimeSpentMin: totalTimeSpent,
        estimatedRemainingMin:
          path.modules
            .filter((m) => !m.progress?.completed)
            .reduce((acc, m) => acc + m.estimatedTime, 0),
      },
    };
  }

  // ─── Actualizar progreso de un módulo ────────────────────────────────────────
  async updateProgress(
    pathId: string,
    moduleId: string,
    userId: string,
    dto: UpdateProgressDto,
  ) {
    // Verificar que el módulo pertenece a una ruta del usuario
    const module = await this.prisma.module.findFirst({
      where: {
        id: moduleId,
        pathId,
        path: { userId },
      },
      include: { progress: true },
    });

    if (!module) {
      throw new NotFoundException('Módulo no encontrado');
    }

    const progress = await this.prisma.moduleProgress.upsert({
      where: { moduleId },
      create: {
        moduleId,
        completed: dto.completed ?? false,
        completedAt: dto.completed ? new Date() : null,
        score: dto.score,
        timeSpent: dto.timeSpent ?? 0,
        notes: dto.notes,
      },
      update: {
        ...(dto.completed !== undefined && { completed: dto.completed }),
        ...(dto.completed && !module.progress?.completedAt && {
          completedAt: new Date(),
        }),
        ...(dto.score !== undefined && { score: dto.score }),
        ...(dto.timeSpent !== undefined && {
          timeSpent: (module.progress?.timeSpent || 0) + dto.timeSpent,
        }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    // Verificar si se completó la ruta completa
    const allModules = await this.prisma.module.findMany({
      where: { pathId },
      include: { progress: true },
    });

    const allCompleted = allModules.every((m) => m.progress?.completed);
    if (allCompleted) {
      await this.prisma.learningPath.update({
        where: { id: pathId },
        data: { status: 'COMPLETED' },
      });
    }

    return progress;
  }

  // ─── Regenerar ruta (ajustar con nueva info) ─────────────────────────────────
  async regenerate(pathId: string, userId: string, adjustments?: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
    });

    if (!path || path.userId !== userId) {
      throw new NotFoundException('Ruta no encontrada');
    }

    // Crear nueva ruta con los mismos parámetros + ajustes.
    // Si la generación falla, create() lanza y la ruta actual queda intacta.
    const newPath = await this.create(userId, {
      topic: path.topic,
      level: path.level as any,
      objectives: path.objectives,
      timeAvailable: path.timeAvailable,
      format: path.format as any,
      specialNeeds: adjustments
        ? `${path.specialNeeds || ''}. Ajuste solicitado: ${adjustments}`
        : path.specialNeeds ?? undefined,
    });

    // Solo con la nueva ruta guardada se archiva la anterior
    await this.prisma.learningPath.update({
      where: { id: pathId },
      data: { status: 'ARCHIVED' },
    });

    return newPath;
  }

  // ─── Eliminar una ruta ────────────────────────────────────────────────────────
  async remove(pathId: string, userId: string) {
    const path = await this.prisma.learningPath.findUnique({
      where: { id: pathId },
    });

    if (!path || path.userId !== userId) {
      throw new NotFoundException('Ruta no encontrada');
    }

    await this.prisma.learningPath.delete({ where: { id: pathId } });
    return { message: 'Ruta eliminada correctamente' };
  }

  // ─── Estadísticas generales del usuario ──────────────────────────────────────
  async getUserStats(userId: string) {
    const [totalPaths, completedPaths, activePaths] = await Promise.all([
      this.prisma.learningPath.count({ where: { userId } }),
      this.prisma.learningPath.count({ where: { userId, status: 'COMPLETED' } }),
      this.prisma.learningPath.count({ where: { userId, status: 'ACTIVE' } }),
    ]);

    const timeSpent = await this.prisma.moduleProgress.aggregate({
      where: {
        module: { path: { userId } },
      },
      _sum: { timeSpent: true },
    });

    return {
      totalPaths,
      completedPaths,
      activePaths,
      totalTimeSpentMin: timeSpent._sum.timeSpent || 0,
    };
  }
}
