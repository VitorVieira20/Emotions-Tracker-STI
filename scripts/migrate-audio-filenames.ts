import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import fs from 'fs';
import path from 'path';
import { log } from './logger';

import { a1Questions } from '../prisma/seeds/a1';
import { a2Questions } from '../prisma/seeds/a2';
import { b1Questions } from '../prisma/seeds/b1';
import { b2Questions } from '../prisma/seeds/b2';
import { c1Questions } from '../prisma/seeds/c1';
import { c2Questions } from '../prisma/seeds/c2';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const allSeedQuestions = [
  ...a1Questions,
  ...a2Questions,
  ...b1Questions,
  ...b2Questions,
  ...c1Questions,
  ...c2Questions,
];

function getAudioText(text: string): string | null {
  const audioMatch = text.match(/\(Audio:\s*'(.+?)'\)/);
  return audioMatch ? audioMatch[1] : null;
}

async function migrate() {
  log.start('Audio filename migration initiated');

  const textToSlug = new Map<string, string>();
  for (const q of allSeedQuestions) {
    if (q.area === 'Listening') {
      const audioText = getAudioText(q.text);
      if (audioText && (q as any).slug) {
        textToSlug.set(audioText, (q as any).slug);
      }
    }
  }

  log.info(`Mapped ${textToSlug.size} slugs from seed definitions`);

  const dbQuestions = await prisma.question.findMany({
    where: { area: 'Listening' },
  });

  log.info(`Found ${dbQuestions.length} Listening questions in database`);

  const audioDir = path.join(process.cwd(), 'public', 'audio', 'questions');
  let renamedCount = 0;

  for (const dbQ of dbQuestions) {
    const { id: oldId, audioText } = dbQ;

    if (!audioText) {
      log.error(`Question ${oldId}: Missing audioText`);
      continue;
    }

    const slug = textToSlug.get(audioText);
    if (!slug) {
      log.skip(`No slug mapping for text: "${audioText.substring(0, 20)}..."`);
      continue;
    }

    const oldPath = path.join(audioDir, `${oldId}.mp3`);
    const newPath = path.join(audioDir, `${slug}.mp3`);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      log.success(`Renamed: ${oldId}.mp3 -> ${slug}.mp3`);
      renamedCount++;
    } else if (fs.existsSync(newPath)) {
      log.skip(`File already migrated: ${slug}.mp3`);
    } else {
      log.error(`Source file not found: ${oldId}.mp3`);
    }
  }

  log.done(`Migration completed. ${renamedCount} files processed.`);
  await prisma.$disconnect();
}

migrate().catch(async (e) => {
  log.error(`Migration failed: ${e.message}`);
  await prisma.$disconnect();
  process.exit(1);
});
