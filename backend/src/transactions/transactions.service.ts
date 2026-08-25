import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';

import { AuthUser } from '../auth/auth.types';
import { PrismaService } from '../prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { TransactionQueryDto } from './dto/transaction-query.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTransactionDto, actor: AuthUser) {
    const category = await this.getMatchingCategory(dto.categoryId, dto.type);
    const transaction = await this.prisma.transaction.create({
      data: this.toCreateData(dto, category.id, actor.id),
      include: { category: true },
    });

    await this.writeAudit(actor.id, 'TRANSACTION_CREATED', transaction.id, transaction);
    return transaction;
  }

  async findAll(query: TransactionQueryDto) {
    const where: Prisma.TransactionWhereInput = {
      deletedAt: null,
      type: query.type,
      categoryId: query.categoryId,
      transactionDate: this.dateFilter(query.from, query.to),
    };
    const skip = (query.page - 1) * query.limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where,
        include: { category: true, createdBy: { select: { id: true, email: true } } },
        orderBy: [{ transactionDate: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { items, page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) };
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findFirst({
      where: { id, deletedAt: null },
      include: { category: true, createdBy: { select: { id: true, email: true } } },
    });
    if (!transaction) throw new NotFoundException('Transaction not found.');
    return transaction;
  }

  async update(id: string, dto: UpdateTransactionDto, actor: AuthUser) {
    const existing = await this.findOne(id);
    const type = dto.type ?? existing.type;
    const categoryId = dto.categoryId ?? existing.categoryId;
    await this.getMatchingCategory(categoryId, type);
    const updated = await this.prisma.transaction.update({
      where: { id },
      data: this.toUpdateData(dto, type, categoryId),
      include: { category: true },
    });

    await this.writeAudit(actor.id, 'TRANSACTION_UPDATED', id, { before: this.auditData(existing), after: this.auditData(updated) });
    return updated;
  }

  async remove(id: string, actor: AuthUser) {
    const existing = await this.findOne(id);
    const deleted = await this.prisma.transaction.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.writeAudit(actor.id, 'TRANSACTION_DELETED', id, this.auditData(existing));
    return { id: deleted.id, deleted: true };
  }

  private async getMatchingCategory(categoryId: string, type: TransactionType) {
    const category = await this.prisma.category.findFirst({ where: { id: categoryId, type } });
    if (!category) throw new BadRequestException('Category does not match the transaction type.');
    return category;
  }

  private toCreateData(dto: CreateTransactionDto, categoryId: string, createdById: string): Prisma.TransactionCreateInput {
    return {
      type: dto.type,
      amount: new Prisma.Decimal(dto.amount),
      category: { connect: { id: categoryId } },
      transactionDate: new Date(dto.transactionDate),
      description: dto.description,
      invoiceNumber: dto.invoiceNumber,
      paymentMethod: dto.paymentMethod,
      createdBy: { connect: { id: createdById } },
    };
  }

  private toUpdateData(dto: UpdateTransactionDto, type: TransactionType, categoryId: string): Prisma.TransactionUpdateInput {
    return {
      type,
      amount: dto.amount === undefined ? undefined : new Prisma.Decimal(dto.amount),
      category: { connect: { id: categoryId } },
      transactionDate: dto.transactionDate ? new Date(dto.transactionDate) : undefined,
      description: dto.description,
      invoiceNumber: dto.invoiceNumber,
      paymentMethod: dto.paymentMethod,
    };
  }

  private dateFilter(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
    if (!from && !to) return undefined;
    return { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined };
  }

  private auditData(transaction: { id: string; type: TransactionType; amount: Prisma.Decimal; categoryId: string; description: string | null; invoiceNumber: string | null; paymentMethod: string | null; transactionDate: Date }) {
    return {
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount.toString(),
      categoryId: transaction.categoryId,
      description: transaction.description,
      invoiceNumber: transaction.invoiceNumber,
      paymentMethod: transaction.paymentMethod,
      transactionDate: transaction.transactionDate.toISOString(),
    };
  }

  private writeAudit(actorUserId: string, action: string, entityId: string, details: unknown) {
    return this.prisma.auditLog.create({ data: { actorUserId, action, entityType: 'TRANSACTION', entityId, details: details as Prisma.InputJsonValue } });
  }
}
