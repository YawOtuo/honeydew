import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma.service';
import { AuthUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    const validPassword = user ? await bcrypt.compare(password, user.passwordHash) : false;

    if (!user || !validPassword) {
      await this.prisma.auditLog.create({
        data: {
          action: 'LOGIN_FAILED',
          entityType: 'AUTH',
          details: { email: email.toLowerCase() },
        },
      });
      throw new UnauthorizedException('Invalid email or password.');
    }

    const authUser = this.toAuthUser(user);
    await this.prisma.auditLog.create({
      data: {
        actorUserId: user.id,
        action: 'LOGIN_SUCCESS',
        entityType: 'AUTH',
        details: {},
      },
    });

    return {
      accessToken: await this.jwtService.signAsync(authUser),
      user: authUser,
    };
  }

  toAuthUser(user: { id: string; email: string; role: AuthUser['role'] }): AuthUser {
    return { id: user.id, email: user.email, role: user.role };
  }

  async validatePayload(payload: JwtPayload): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    return this.toAuthUser(user);
  }
}
