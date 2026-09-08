import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(includeArchived: boolean, actor: AuthUser) {
    if (includeArchived && actor.role !== 'ADMIN') throw new ForbiddenException('Only administrators can view archived categories.');
    return this.prisma.category.findMany({
      where: includeArchived ? undefined : { isActive: true },
      orderBy: [{ type: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async create(dto: CreateCategoryDto, actor: AuthUser) {
    const name = this.cleanName(dto.name);
    try {
      const category = await this.prisma.category.create({
        data: { name, normalizedName: this.normalizeName(name), type: dto.type, color: dto.color, sortOrder: dto.sortOrder ?? 0 },
      });
      await this.writeAudit(actor.id, 'CATEGORY_CREATED', category.id, category);
      return category;
    } catch (error) {
      this.handleUniqueError(error);
    }
  }

  async update(id: string, dto: UpdateCategoryDto, actor: AuthUser) {
    const existing = await this.getById(id);
    if (Object.keys(dto).length === 0) throw new BadRequestException('Provide at least one category change.');
    const name = dto.name === undefined ? undefined : this.cleanName(dto.name);
    try {
      const updated = await this.prisma.category.update({
        where: { id },
        data: { name, normalizedName: name ? this.normalizeName(name) : undefined, color: dto.color, sortOrder: dto.sortOrder },
      });
      await this.writeAudit(actor.id, 'CATEGORY_UPDATED', id, { before: existing, after: updated });
      return updated;
    } catch (error) {
      this.handleUniqueError(error);
    }
  }

  async setActive(id: string, isActive: boolean, actor: AuthUser) {
    const existing = await this.getById(id);
    if (existing.isActive === isActive) return existing;
    const updated = await this.prisma.category.update({ where: { id }, data: { isActive } });
    await this.writeAudit(actor.id, isActive ? 'CATEGORY_RESTORED' : 'CATEGORY_ARCHIVED', id, { before: existing, after: updated });
    return updated;
  }

  private async getById(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new NotFoundException('Category not found.');
    return category;
  }

  private cleanName(name: string) {
    const cleaned = name.trim().replace(/\s+/g, ' ');
    if (!cleaned) throw new BadRequestException('Category name is required.');
    return cleaned;
  }

  private normalizeName(name: string) {
    return name.toLocaleLowerCase('en');
  }

  private handleUniqueError(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A category with this name already exists for this transaction type.');
    }
    throw error;
  }

  private writeAudit(actorUserId: string, action: string, entityId: string, details: unknown) {
    return this.prisma.auditLog.create({ data: { actorUserId, action, entityType: 'CATEGORY', entityId, details: details as Prisma.InputJsonValue } });
  }
}
