import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';

import { PrismaService } from '../prisma.service';
import { AuthUser, JwtPayload } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

    return this.issueTokens(user.id, authUser);
  }

  async refresh(refreshToken: string) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is required.');

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, { secret: refreshSecret });
      if (payload.type !== 'refresh') throw new UnauthorizedException('Invalid refresh token.');
      const user = await this.prisma.user.findUnique({ where: { id: payload.id } });
      if (!user || !user.refreshTokenHash || user.refreshTokenHash !== this.hashToken(refreshToken)) {
        throw new UnauthorizedException('Invalid refresh token.');
      }
      return this.issueTokens(user.id, this.toAuthUser(user));
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  private async issueTokens(userId: string, user: AuthUser) {
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) throw new Error('JWT_REFRESH_SECRET is required.');
    const accessToken = await this.jwtService.signAsync(user);
    const refreshToken = await this.jwtService.signAsync({ ...user, type: 'refresh' }, { secret: refreshSecret, expiresIn: '30d' });
    await this.prisma.user.update({ where: { id: userId }, data: { refreshTokenHash: this.hashToken(refreshToken) } });
    return { accessToken, refreshToken, user };
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
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
