import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  // ─── Registro de nuevo usuario ──────────────────────────────────────────────
  async register(dto: RegisterDto) {
    // Verificar si el email ya existe
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (exists) {
      throw new ConflictException('Ya existe una cuenta con este correo electrónico');
    }

    // Hash de contraseña
    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    // Crear usuario con perfil inicial
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        name: dto.name.trim(),
        passwordHash,
        profile: {
          create: {
            weeklyHours: 5,
            preferredFormats: [],
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const token = this.signToken(user.id, user.email);

    return {
      user,
      accessToken: token,
    };
  }

  // ─── Inicio de sesión ──────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const { passwordHash, ...userSafe } = user;
    const token = this.signToken(user.id, user.email);

    return {
      user: userSafe,
      accessToken: token,
    };
  }

  // ─── Obtener perfil del usuario autenticado ────────────────────────────────
  async getMe(userId: string) {
    return this.prisma.user.findUnique({
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
  }

  // ─── Firmar JWT ────────────────────────────────────────────────────────────
  private signToken(userId: string, email: string): string {
    return this.jwt.sign(
      { sub: userId, email },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '7d',
      },
    );
  }
}
