import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';
import { log } from './logger';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  log.start('Admin user seeding process started');

  try {
    const username = 'admin';
    const passwordHash = await bcrypt.hash('admin123', 10);

    log.info(`Upserting admin user: ${username}`);

    const admin = await prisma.user.upsert({
      where: { username },
      update: {
        name: "Admin Admin",
        englishLevel: "C1",
        onboardingCompleted: true,
        frownBase: 0.005660146104676447,
        frownMax: 0.28489481540102707,
        smileMax: 0.9768247119041794,
        strongAreas: ["Reading", "Vocabulary", "Speaking", "Grammar", "Writing"],
        weakAreas: ["Listening"],
      },
      create: {
        username,
        passwordHash,
        name: "Admin Admin",
        englishLevel: "C1",
        onboardingCompleted: true,
        frownBase: 0.005660146104676447,
        frownMax: 0.28489481540102707,
        smileMax: 0.9768247119041794,
        strongAreas: ["Reading", "Vocabulary", "Speaking", "Grammar", "Writing"],
        weakAreas: ["Listening"],
      },
    });

    log.success(`Admin user '${admin.username}' (${admin.englishLevel} level) is ready for testing`);
    log.done('Admin seeding completed');
  } catch (error: any) {
    log.error(`Admin seeding failed: ${error.message}`);
    process.exit(1);
  } finally {
    log.info('Disconnecting Prisma Client...');
    await prisma.$disconnect();
  }
}

seedAdmin();
