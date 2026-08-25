import { ConflictException, Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma.service';
import { AuthUser } from '../auth/auth.types';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateUserDto, actor: AuthUser): Promise<AuthUser> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new ConflictException('A user with this email already exists.');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({ data: { email, passwordHash, role: dto.role } });
    const createdUser = { id: user.id, email: user.email, role: user.role };

    await this.prisma.auditLog.create({
      data: {
        actorUserId: actor.id,
        action: 'USER_CREATED',
        entityType: 'USER',
        entityId: user.id,
        details: { email: user.email, role: user.role },
      },
    });

    return createdUser;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  isAdmin(user: AuthUser) {
    return user.role === UserRole.ADMIN;
  }
}
