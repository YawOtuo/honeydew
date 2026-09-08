import { PrismaClient, TransactionType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required to seed the first admin.');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash, role: 'ADMIN' },
    create: { email, passwordHash, role: 'ADMIN' },
  });

  const catalogue = {
    [TransactionType.INCOME]: ['Fees', 'Feeding', 'Blue Uniform', 'Anniversary Cloth', 'Friday Wear', 'Exercise Books', 'Text Books', 'Stationery', 'Bus Fare', 'Loan', 'Others'],
    [TransactionType.EXPENSE]: ['Salary', 'Friday Allowance', 'Market', 'Blue Uniform', 'Anniversary Cloth', 'Friday Wear', 'Exercise Books', 'Text Books', 'Stationery', 'Bus Fuel', 'Uber', 'Waste', 'Bus Maintenance', 'Loan Repayment', 'Insurance', 'Utility Bill', 'Certificates/Permit', 'Maintenance', 'Others'],
  };

  for (const type of [TransactionType.INCOME, TransactionType.EXPENSE]) {
    for (const [sortOrder, name] of catalogue[type].entries()) {
      const normalizedName = name.toLowerCase();
      await prisma.category.upsert({
        where: { normalizedName_type: { normalizedName, type } },
        update: {},
        create: { name, normalizedName, type, color: '#71817B', sortOrder },
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
