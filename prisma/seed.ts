import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import chalk from 'chalk';
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


function getTimestamp() {
  return chalk.dim(`[${new Date().toLocaleTimeString('en-GB', { hour12: false })}]`);
}

const log = {
  start: (msg: string) => console.log(`${getTimestamp()} ${chalk.cyan('[START]')}   ${msg}`),
  info: (msg: string) => console.log(`${getTimestamp()} ${chalk.blue('[INFO]')}    ${msg}`),
  success: (msg: string) => console.log(`${getTimestamp()} ${chalk.green('[SUCCESS]')} ${msg}`),
  error: (msg: string) => console.error(`${getTimestamp()} ${chalk.red('[ERROR]')}   ${msg}`),
  done: (msg: string) => console.log(`\n${getTimestamp()} ${chalk.bold.green('[DONE]')}    ${msg}`),
};

const allQuestions = [
  ...a1Questions,
  ...a2Questions,
  ...b1Questions,
  ...b2Questions,
  ...c1Questions,
  ...c2Questions,
];


const counters: Record<string, number> = {};

const transformedQuestions = allQuestions.map(q => {
  let audioText = q.audioText;
  let text = q.text;

  if (q.area === 'Listening') {
    const audioMatch = q.text.match(/\(Audio:\s*'(.+?)'\)/);
    if (audioMatch) {
      audioText = audioMatch[1];
      let cleanedText = q.text.replace(/[:\s'"]+\(Audio:\s*'.+?'\)['"\s.]+/g, '. ').trim();
      cleanedText = cleanedText.replace(/\.\s+\./g, '.').replace(/\s+/g, ' ');
      text = cleanedText;
    }
  }

  const areaKey = q.area.toLowerCase();
  const levelKey = q.cefrLevel.toLowerCase();
  const counterKey = `${areaKey}-${levelKey}`;
  
  counters[counterKey] = (counters[counterKey] || 0) + 1;
  const index = counters[counterKey].toString().padStart(2, '0');
  const slug = `${areaKey}-${levelKey}-${index}`;

  return {
    ...q,
    text,
    audioText,
    slug
  };
});

async function main() {
  log.start('Database seeding process started');

  try {
    log.info('Deleting existing questions...');
    await prisma.question.deleteMany();
    log.success('Existing questions deleted');

    if (transformedQuestions.length === 0) {
      log.error('No questions found to seed');
      return;
    }
    
    log.info(`Seeding ${transformedQuestions.length} questions...`);
    
    const result = await prisma.question.createMany({
      data: transformedQuestions,
      skipDuplicates: true,
    });

    log.success(`Successfully created ${result.count} questions`);
    log.done('Database seeding completed');
  } catch (e: any) {
    log.error(`Seeding failed: ${e.message}`);
    throw e;
  }
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    log.info('Disconnecting Prisma Client...');
    await prisma.$disconnect();
  });
