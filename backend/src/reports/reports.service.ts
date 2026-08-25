import { Injectable } from '@nestjs/common';
import { Prisma, TransactionType } from '@prisma/client';

import { PrismaService } from '../prisma.service';
import { ReportQueryDto } from './dto/report-query.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: ReportQueryDto) {
    const where = this.where(query.from, query.to);
    const [income, expense, recent] = await this.prisma.$transaction([
      this.prisma.transaction.aggregate({ where: { ...where, type: TransactionType.INCOME }, _sum: { amount: true } }),
      this.prisma.transaction.aggregate({ where: { ...where, type: TransactionType.EXPENSE }, _sum: { amount: true } }),
      this.prisma.transaction.findMany({ where, include: { category: true }, orderBy: { transactionDate: 'desc' }, take: 5 }),
    ]);
    const incomeTotal = income._sum.amount ?? new Prisma.Decimal(0);
    const expenseTotal = expense._sum.amount ?? new Prisma.Decimal(0);
    return { income: incomeTotal.toString(), expenses: expenseTotal.toString(), balance: incomeTotal.minus(expenseTotal).toString(), recent };
  }

  async byCategory(query: ReportQueryDto) {
    const groups = await this.prisma.transaction.groupBy({
      by: ['categoryId', 'type'],
      where: this.where(query.from, query.to),
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
    });
    const categories = await this.prisma.category.findMany({ where: { id: { in: groups.map((group) => group.categoryId) } } });
    return groups.map((group) => ({ category: categories.find((item) => item.id === group.categoryId), type: group.type, amount: (group._sum.amount ?? new Prisma.Decimal(0)).toString() }));
  }

  async monthly(query: ReportQueryDto) {
    const year = query.year ?? new Date().getFullYear();
    const transactions = await this.prisma.transaction.findMany({ where: { ...this.where(`${year}-01-01`, `${year}-12-31T23:59:59.999Z`) }, select: { type: true, amount: true, transactionDate: true } });
    return Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const entries = transactions.filter((transaction) => transaction.transactionDate.getUTCMonth() + 1 === month);
      const income = entries.filter((entry) => entry.type === TransactionType.INCOME).reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0));
      const expenses = entries.filter((entry) => entry.type === TransactionType.EXPENSE).reduce((sum, entry) => sum.plus(entry.amount), new Prisma.Decimal(0));
      return { month, income: income.toString(), expenses: expenses.toString(), balance: income.minus(expenses).toString() };
    });
  }

  private where(from?: string, to?: string): Prisma.TransactionWhereInput {
    return { deletedAt: null, transactionDate: from || to ? { gte: from ? new Date(from) : undefined, lte: to ? new Date(to) : undefined } : undefined };
  }
}
