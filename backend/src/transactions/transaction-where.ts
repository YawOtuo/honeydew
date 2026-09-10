import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { TransactionFilterDto } from './dto/transaction-filter.dto';

export function buildTransactionWhere(query: TransactionFilterDto, extra: Prisma.TransactionWhereInput = {}): Prisma.TransactionWhereInput {
  const categoryIds = query.categoryIds?.length ? query.categoryIds : query.categoryId ? [query.categoryId] : undefined;
  const paymentMethods = query.paymentMethods?.length ? query.paymentMethods : query.paymentMethod ? [query.paymentMethod] : undefined;
  const search = query.search?.trim();
  return {
    deletedAt: null,
    type: query.type,
    categoryId: categoryIds ? { in: categoryIds } : undefined,
    paymentMethod: paymentMethods ? { in: paymentMethods } : undefined,
    createdById: query.createdById,
    transactionDate: dateFilter(query.from, query.to),
    amount: amountFilter(query.minAmount, query.maxAmount),
    ...(search
      ? {
          OR: [
            { description: { contains: search, mode: 'insensitive' } },
            { invoiceNumber: { contains: search, mode: 'insensitive' } },
            { category: { name: { contains: search, mode: 'insensitive' } } },
          ],
        }
      : {}),
    ...extra,
  };
}

function dateFilter(from?: string, to?: string): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;
  const gte = from ? new Date(from) : undefined;
  const lte = to ? new Date(to) : undefined;
  if (gte && lte && gte > lte) throw new BadRequestException('The start date must be before the end date.');
  return { gte, lte };
}

function amountFilter(minAmount?: string, maxAmount?: string): Prisma.DecimalFilter | undefined {
  if (!minAmount && !maxAmount) return undefined;
  const gte = minAmount ? new Prisma.Decimal(minAmount) : undefined;
  const lte = maxAmount ? new Prisma.Decimal(maxAmount) : undefined;
  if (gte && lte && gte.greaterThan(lte)) throw new BadRequestException('The minimum amount must be less than the maximum amount.');
  return { gte, lte };
}
