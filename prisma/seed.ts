import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { a1Questions } from './seeds/a1';
import { a2Questions } from './seeds/a2';
import { b1Questions } from './seeds/b1';
import { b2Questions } from './seeds/b2';
import { c1Questions } from './seeds/c1';
import { c2Questions } from './seeds/c2';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

const allQuestions = [
  ...a1Questions,
  ...a2Questions,
  ...b1Questions,
  ...b2Questions,
  ...c1Questions,
  ...c2Questions,
];

async function main() {
  console.log('Starting the seeding process...');

  console.log('Deleting existing questions...');
  await prisma.question.deleteMany();
  console.log('All existing questions have been deleted.');

  if (allQuestions.length === 0) {
    console.log('No questions to seed. Please populate the seed files.');
    return;
  }
  
  console.log(`Seeding database with ${allQuestions.length} questions...`);
  
  const result = await prisma.question.createMany({
    data: allQuestions,
    skipDuplicates: true,
  });

  console.log(`Successfully created ${result.count} new questions.`);
  console.log('Seeding finished successfully.');
}

main()
  .catch((e) => {
    console.error('An error occurred during seeding:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log('Disconnecting Prisma Client...');
    await prisma.$disconnect();
  });
