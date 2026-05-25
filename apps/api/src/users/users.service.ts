import { Injectable, NotFoundException } from '@nestjs/common';
import { LearningFormat } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface UpdateProfileDto {
  name?: string;
  bio?: string;
  occupation?: string;
  preferredFormats?: string[];   // llega como string[] desde el frontend
  learningStyle?: string;
  weeklyHours?: number;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        isVerified: true,
        createdAt: true,
        profile: true,
        _count: {
          select: { learningPaths: true },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const { name, preferredFormats, ...rest } = dto;

    // Castear string[] → LearningFormat[] que espera Prisma
    const formats = preferredFormats as LearningFormat[] | undefined;

    const profileData = { ...rest, ...(formats !== undefined && { preferredFormats: formats }) };

    await this.prisma.$transaction(async (tx) => {
      if (name) {
        await tx.user.update({
          where: { id: userId },
          data: { name },
        });
      }

      await tx.userProfile.upsert({
        where:  { userId },
        create: { userId, ...profileData },
        update: profileData,
      });
    });

    return this.getProfile(userId);
  }
}
