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

  await prisma.category.upsert({
    where: { name_type: { name: 'General', type: TransactionType.INCOME } },
    update: {},
    create: { name: 'General', type: TransactionType.INCOME, color: '#71817B' },
  });

  await prisma.category.upsert({
    where: { name_type: { name: 'General', type: TransactionType.EXPENSE } },
    update: {},
    create: { name: 'General', type: TransactionType.EXPENSE, color: '#71817B' },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
